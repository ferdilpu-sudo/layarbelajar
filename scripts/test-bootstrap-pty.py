#!/usr/bin/env python3
"""Minimal PTY harness for real interactive bootstrap; never prints credentials."""
import errno
import os
import pty
import select
import sys
import time


def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith("lb_boot_"):
        return 2
    username = sys.argv[1]
    # The secret is delivered through private stdin, not command arguments or env.
    secret = sys.stdin.buffer.readline().rstrip(b"\r\n")
    if len(secret) < 12:
        return 2
    pid, master = pty.fork()
    if pid == 0:
        os.execvp("node", ["node", "scripts/bootstrap-admin.mjs", username, "Admin Uji Lokal"])
    text = bytearray()
    sent = False
    code = None
    deadline = time.monotonic() + 18
    try:
        while time.monotonic() < deadline:
            ready, _, _ = select.select([master], [], [], 0.25)
            if ready:
                try:
                    chunk = os.read(master, 8192)
                except OSError as exc:
                    if exc.errno == errno.EIO:
                        break
                    raise
                if not chunk:
                    break
                text.extend(chunk)
                if not sent and b"Password admin (12+ characters, hidden):" in text:
                    sent = True
                    os.write(master, secret + b"\r")
            waited, status = os.waitpid(pid, os.WNOHANG)
            if waited:
                code = os.waitstatus_to_exitcode(status)
                break
        if code is None:
            waited, status = os.waitpid(pid, os.WNOHANG)
            if waited:
                code = os.waitstatus_to_exitcode(status)
        if code is None:
            try:
                os.kill(pid, 9)
            except ProcessLookupError:
                pass
            os.waitpid(pid, 0)
            print("PTY_TIMEOUT", file=sys.stderr)
            return 1
        if secret in text:
            print("PTY_SECRET_ECHO_DETECTED", file=sys.stderr)
            return 1
        if code != 0 or not sent or b"Local admin bootstrapped successfully" not in text:
            # Do not print arbitrary child output; it could include sensitive data.
            print("PTY_BOOTSTRAP_FAILED code=" + str(code) + " prompt=" + str(sent), file=sys.stderr)
            return 1
        print("BOOTSTRAP_PTY_OK")
        return 0
    finally:
        os.close(master)


if __name__ == "__main__":
    sys.exit(main())
