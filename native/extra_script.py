Import("env")
import sys

env.Replace(PROGNAME="firefox-webserial")

# Add macOS framework linkage
if sys.platform == "darwin":
    env.Append(LINKFLAGS=["-framework", "IOKit", "-framework", "CoreFoundation"])
