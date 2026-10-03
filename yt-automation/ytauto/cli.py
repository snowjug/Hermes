"""Command line: `ytauto <command>`. Run `ytauto -h` for the list."""

from __future__ import annotations

import argparse
import json
import logging
import os
import shutil
import subprocess
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from . import scheduling, uploader
from .config import PROJECT_ROOT, Config, load_config
from .db import Store
from .pipeline import AlreadyRunning, Pipeline, lock_path, single_instance

log = logging.getLogger("ytauto")


def setup_logging(cfg: Config, verbose: bool) -> None:
    cfg.path("logs").mkdir(parents=True, exist_ok=True)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    fh = RotatingFileHandler(cfg.path("logs") / "ytauto.log", maxBytes=2_000_000, backupCount=5, encoding="utf-8")
    fh.setFormatter(fmt)
    root.addHandler(fh)
    if sys.stderr is not None:  # pythonw has no console
        sh = logging.StreamHandler()
        sh.setFormatter(fmt)
        sh.setLevel(logging.INFO if verbose else logging.WARNING)
        root.addHandler(sh)


def _pipeline(cfg: Config) -> Pipeline:
    return Pipeline(cfg, Store(cfg.db_path))


# ---- commands -----------------------------------------------------------------------------


def cmd_init(cfg: Config, args) -> int:
    cfg.ensure_dirs()
    Store(cfg.db_path).close()
    print(f"ready: drop videos into {cfg.path('inbox')}")
    return 0


def cmd_login(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    ok = uploader.login(cfg.uploader, cfg.path("browser_profile"), cfg.tz)
    if ok:
        p.clear_needs_login()
        print("signed in; uploads are enabled")
        return 0
    print("still signed out: YouTube Studio redirected to the Google sign-in page. Run `ytauto login` again")
    return 1


def cmd_add(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    hints = {}
    for key in ("title", "notes", "visibility"):
        if getattr(args, key):
            hints[key] = getattr(args, key)
    if args.tags:
        hints["tags"] = [t.strip() for t in args.tags.split(",") if t.strip()]
    if args.altered_content:
        hints["altered_content"] = True
    when = scheduling.parse_when(args.at, cfg.tz) if args.at else None
    metadata = json.loads(Path(args.metadata).read_text(encoding="utf-8")) if args.metadata else None
    job = p.add(Path(args.video), publish_at=when, hints=hints, move=args.move, metadata=metadata,
                thumbnail=Path(args.thumbnail) if args.thumbnail else None, hold=args.hold)
    print(f"{job.id}: {job.source_name} publishes {p.fmt(job.publish_at)}")
    return 0


def cmd_tick(cfg: Config, args) -> int:
    try:
        with single_instance(lock_path(cfg)):
            lines = _pipeline(cfg).tick()
            log.info("tick finished: %s", "; ".join(lines) or "nothing to do")
            for line in lines:
                print(line)
    except AlreadyRunning:
        log.info("tick skipped: previous tick still running")
    return 0


def cmd_status(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    jobs = p.store.list(None if args.all else ("queued", "transcribed", "ready", "uploading", "failed"))
    if p.needs_login_flag.exists():
        print("! uploads paused: run `ytauto login`\n")
    if not jobs:
        print("no jobs")
        return 0
    for job in jobs:
        meta_path = job.work_dir / "metadata.json"
        title = json.loads(meta_path.read_text(encoding="utf-8"))["title"] if meta_path.exists() else job.source_name
        status = job.status if job.approved or job.status != "ready" else "ready (needs approval)"
        extra = job.video_url or job.last_error or ""
        print(f"{job.id}  {status:<22} {p.fmt(job.publish_at):<28} {title}")
        if extra:
            print(f"{'':>17}{extra}")
    return 0


def cmd_show(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    job = p.store.get(args.job)
    print(f"id:        {job.id}\nfile:      {job.video_path}\nstatus:    {job.status}\n"
          f"publish:   {p.fmt(job.publish_at)}\napproved:  {job.approved}\nurl:       {job.video_url or '-'}")
    if job.hints:
        print(f"hints:     {json.dumps(job.hints, ensure_ascii=False)}")
    meta_path = job.work_dir / "metadata.json"
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        print(f"\nTITLE: {meta['title']}\nTAGS:  {', '.join(meta['tags'])}\n\n{meta['description']}")
        print(f"\n(edit {meta_path} to change anything before upload)")
    print("\nhistory:")
    for ev in p.store.events(job.id):
        print(f"  {ev['ts']}  {ev['status']:<12} {ev['message']}")
    return 0


def cmd_approve(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    job = p.store.update(p.store.get(args.job).id, approved=True, log="approved")
    print(f"{job.id} approved; publishes {p.fmt(job.publish_at)}")
    return 0


def cmd_retry(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    job = p.store.get(args.job)
    meta_ready = (job.work_dir / "metadata.json").exists()
    transcribed = (job.work_dir / "transcript.json").exists() or not cfg.transcription.get("enabled", True)
    status = "ready" if meta_ready else "transcribed" if transcribed else "queued"
    job = p.store.update(job.id, status=status, attempts=0, next_attempt_at=None, last_error=None,
                         log=f"retry requested; back to {status}")
    print(f"{job.id} -> {status}")
    return 0


def cmd_reschedule(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    job = p.store.get(args.job)
    if job.status == "done":
        print("already uploaded; change the schedule in YouTube Studio")
        return 1
    when = scheduling.parse_when(args.at, cfg.tz)
    job = p.store.update(job.id, publish_at=when, log=f"rescheduled to {p.fmt(when)}")
    print(f"{job.id} publishes {p.fmt(job.publish_at)}")
    return 0


def cmd_cancel(cfg: Config, args) -> int:
    p = _pipeline(cfg)
    job = p.store.update(p.store.get(args.job).id, status="cancelled", log="cancelled")
    print(f"{job.id} cancelled (files kept in {job.work_dir})")
    return 0


def cmd_describe(cfg: Config, args) -> int:
    """Rewrite metadata for a job (e.g. after changing channel/style in config.yaml)."""
    p = _pipeline(cfg)
    job = p.store.get(args.job)
    if job.status in ("uploading", "done"):
        print(f"job is {job.status}; nothing to rewrite")
        return 1
    if job.status == "ready":
        job = p.store.update(job.id, status="transcribed", log="metadata rewrite requested")
    job = p.prepare(job)
    print(f"{job.id}: {job.status}")
    return 0 if job.status == "ready" else 1


def cmd_upload(cfg: Config, args) -> int:
    """Upload one job right now, ignoring its slot. --draft uploads it as a private video."""
    p = _pipeline(cfg)
    try:
        with single_instance(lock_path(cfg)):
            job = p.store.get(args.job)
            if job.status in ("queued", "transcribed"):
                job = p.prepare(job)
            if job.status != "ready":
                print(f"job is {job.status}: {job.last_error or ''}")
                return 1
            job = p.upload_job(job, draft=args.draft, resume_draft=args.resume_draft)
    except AlreadyRunning:
        print("a tick is running; try again in a minute")
        return 1
    print(f"{job.id}: {job.status} {job.video_url or job.last_error or ''}")
    return 0 if job.status == "done" else 1


def cmd_publish(cfg: Config, args) -> int:
    """Make an already uploaded video public right now (from private, unlisted or scheduled)."""
    p = _pipeline(cfg)
    job = p.store.get(args.job)
    if job.status != "done" or not job.video_url:
        print(f"job is {job.status}; only uploaded videos can be published. Use `ytauto upload {job.id}`")
        return 1
    try:
        with single_instance(lock_path(cfg)):
            shown = uploader.set_visibility(job.video_url, "public", cfg=cfg.uploader,
                                            profile_dir=cfg.path("browser_profile"), tz=cfg.tz,
                                            shots_dir=job.work_dir)
    except AlreadyRunning:
        print("a tick is running; try again in a minute")
        return 1
    except uploader.NeedsLogin as exc:
        p.set_needs_login(str(exc))
        print(exc)
        return 1
    p.store.update(job.id, log=f"published now: {shown}")
    print(f"{job.id}: {shown} {job.video_url}")
    return 0


def cmd_update_details(cfg: Config, args) -> int:
    """Push the job's metadata.json title and description to the already uploaded video."""
    p = _pipeline(cfg)
    job = p.store.get(args.job)
    if job.status != "done" or not job.video_url:
        print(f"job is {job.status}; edit {job.work_dir / 'metadata.json'} and it will be used at upload")
        return 1
    meta = json.loads((job.work_dir / "metadata.json").read_text(encoding="utf-8"))
    try:
        with single_instance(lock_path(cfg)):
            uploader.set_details(job.video_url, meta["title"], meta["description"], cfg=cfg.uploader,
                                 profile_dir=cfg.path("browser_profile"), tz=cfg.tz, shots_dir=job.work_dir)
    except AlreadyRunning:
        print("a tick is running; try again in a minute")
        return 1
    p.store.update(job.id, log="title and description updated in Studio")
    print(f"{job.id}: details updated {job.video_url}")
    return 0


def cmd_set_thumbnail(cfg: Config, args) -> int:
    """Upload the job's thumbnail (or --image) to the already uploaded video."""
    p = _pipeline(cfg)
    job = p.store.get(args.job)
    if job.status != "done" or not job.video_url:
        print(f"job is {job.status}; the thumbnail is applied during upload")
        return 1
    image = Path(args.image) if args.image else job.work_dir / (job.hints.get("thumbnail") or "thumbnail.jpg")
    if not image.exists():
        print(f"no thumbnail image at {image}")
        return 1
    try:
        with single_instance(lock_path(cfg)):
            uploader.set_thumbnail(job.video_url, image, cfg=cfg.uploader, profile_dir=cfg.path("browser_profile"),
                                   tz=cfg.tz, shots_dir=job.work_dir)
    except AlreadyRunning:
        print("a tick is running; try again in a minute")
        return 1
    p.store.update(job.id, log=f"custom thumbnail set from {image.name}")
    print(f"{job.id}: thumbnail set {job.video_url}")
    return 0


# ---- Hermes / Claude Code integration -----------------------------------------------------

SHIM = '''"""Generated by `ytauto integrate`. Hermes cron runs this in --no-agent mode.

It starts `ytauto tick` in the background and exits at once, so a long upload never hits the
cron script timeout or blocks other Hermes jobs. ytauto sends its own notifications.
Empty stdout keeps Hermes silent.
"""
import subprocess
import sys

PYTHON = {python!r}
PROJECT = {project!r}

flags = 0
if sys.platform == "win32":
    flags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
kwargs = dict(cwd=PROJECT, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
              close_fds=True)
try:
    subprocess.Popen([PYTHON, "-m", "ytauto", "tick"], creationflags=flags | 0x01000000, **kwargs)
except OSError:  # the parent job object may forbid CREATE_BREAKAWAY_FROM_JOB
    subprocess.Popen([PYTHON, "-m", "ytauto", "tick"], creationflags=flags, **kwargs)
'''


def hermes_home() -> Path:
    if os.environ.get("HERMES_HOME"):
        return Path(os.environ["HERMES_HOME"])
    if sys.platform == "win32" and os.environ.get("LOCALAPPDATA"):
        return Path(os.environ["LOCALAPPDATA"]) / "hermes"
    return Path.home() / ".hermes"


def _venv_pythonw() -> str:
    exe = Path(sys.executable)
    windowless = exe.with_name("pythonw.exe")
    return str(windowless if windowless.exists() else exe)


def cmd_integrate(cfg: Config, args) -> int:
    hermes = shutil.which("hermes")
    home = hermes_home()

    # 1. Hermes cron shim
    scripts = home / "scripts"
    scripts.mkdir(parents=True, exist_ok=True)
    shim = scripts / "ytauto_tick.py"
    shim.write_text(SHIM.format(python=_venv_pythonw(), project=str(cfg.root)), encoding="utf-8")
    print(f"wrote {shim}")

    # 2. Skills for both agents (same SKILL.md; both follow the agentskills.io format)
    skill_src = cfg.root / "skills" / "youtube-automation" / "SKILL.md"
    targets = [home / "skills" / "social-media" / "youtube-automation",
               Path(args.claude_dir) / "skills" / "youtube-automation"]
    for dst in targets:
        dst.mkdir(parents=True, exist_ok=True)
        shutil.copy2(skill_src, dst / "SKILL.md")
        print(f"installed skill -> {dst}")

    # 3. Hermes cron job
    if not hermes:
        print("hermes not on PATH; skipped the cron job")
        return 1
    listing = subprocess.run([hermes, "cron", "list"], capture_output=True, text=True, encoding="utf-8").stdout
    if "ytauto-tick" in listing:
        print("hermes cron job 'ytauto-tick' already exists")
    else:
        res = subprocess.run(
            [hermes, "cron", "create", f"every {args.every}", "--no-agent", "--script", "ytauto_tick.py",
             "--name", "ytauto-tick", "--deliver", "local"],
            capture_output=True, text=True, encoding="utf-8",
        )
        print(res.stdout.strip() or res.stderr.strip())
        if res.returncode != 0:
            return res.returncode
    print("\nHermes fires cron jobs only while its gateway runs. If it is not installed yet:\n"
          "  hermes gateway install      (starts at every logon)\n  hermes cron status")
    return 0


# ---- entry point --------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="ytauto", description="Local YouTube upload pipeline")
    ap.add_argument("--config", help="path to config.yaml (default: project config.yaml)")
    ap.add_argument("-v", "--verbose", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="create folders and the database").set_defaults(fn=cmd_init)
    sub.add_parser("login", help="sign in to YouTube in the automation browser profile").set_defaults(fn=cmd_login)

    a = sub.add_parser("add", help="queue a video from anywhere on disk")
    a.add_argument("video")
    a.add_argument("--at", help='publish time, e.g. "2026-09-28 18:00" (local); default: next free slot')
    a.add_argument("--title", help="use this title instead of a generated one")
    a.add_argument("--notes", help="context for the writer: what the video is about, links to mention")
    a.add_argument("--tags", help="comma-separated tags to always include")
    a.add_argument("--visibility", choices=["public", "unlisted", "private"])
    a.add_argument("--move", action="store_true", help="move the file instead of copying it")
    a.add_argument("--metadata", help="metadata.json already written (title, description, tags); skips "
                                      "transcription and describing")
    a.add_argument("--thumbnail", help="custom thumbnail image (1280x720 PNG/JPG, under 2 MB)")
    a.add_argument("--altered-content", action="store_true",
                   help="answer YouTube's 'altered or synthetic content' question with Yes")
    a.add_argument("--hold", action="store_true", help="wait for `ytauto approve` before uploading")
    a.set_defaults(fn=cmd_add)

    sub.add_parser("tick", help="run one pipeline pass (what the scheduler calls)").set_defaults(fn=cmd_tick)
    s = sub.add_parser("status", help="list jobs")
    s.add_argument("--all", action="store_true", help="include done and cancelled jobs")
    s.set_defaults(fn=cmd_status)

    for name, fn, help_ in (
        ("show", cmd_show, "show a job's metadata and history"),
        ("approve", cmd_approve, "allow a job to upload (when require_approval is on)"),
        ("retry", cmd_retry, "reset a failed job"),
        ("cancel", cmd_cancel, "stop a job from uploading"),
        ("describe", cmd_describe, "regenerate title/description/tags"),
        ("publish", cmd_publish, "make an uploaded video public now"),
        ("update-details", cmd_update_details, "push metadata.json title/description to the uploaded video"),
    ):
        c = sub.add_parser(name, help=help_)
        c.add_argument("job")
        c.set_defaults(fn=fn)

    r = sub.add_parser("reschedule", help="change a job's publish time")
    r.add_argument("job")
    r.add_argument("at", help='e.g. "2026-09-28 18:00"')
    r.set_defaults(fn=cmd_reschedule)

    t = sub.add_parser("set-thumbnail", help="upload a custom thumbnail to an uploaded video")
    t.add_argument("job")
    t.add_argument("--image", help="image file (default: the job's thumbnail)")
    t.set_defaults(fn=cmd_set_thumbnail)

    u = sub.add_parser("upload", help="upload a job now")
    u.add_argument("job")
    u.add_argument("--draft", action="store_true", help="upload as private (safe test)")
    u.add_argument("--resume-draft", action="store_true",
                   help="finish the Studio draft with this job's title instead of uploading the file again")
    u.set_defaults(fn=cmd_upload)

    i = sub.add_parser("integrate", help="register with Hermes cron and install the agent skill")
    i.add_argument("--every", default="10m", help="tick interval for the Hermes cron job (default 10m)")
    i.add_argument("--claude-dir", default=str(PROJECT_ROOT.parent / ".claude"),
                   help="Claude Code .claude folder to install the skill into")
    i.set_defaults(fn=cmd_integrate)
    return ap


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    cfg = load_config(args.config)
    cfg.ensure_dirs()
    setup_logging(cfg, args.verbose)
    try:
        return args.fn(cfg, args)
    except KeyError as exc:
        print(exc.args[0] if exc.args else exc)
        return 2
