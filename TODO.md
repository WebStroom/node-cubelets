high
----
- detect incompatible avr block types in upgrade.js

medium
------
- move block map up into base strategy
- re-implement read block message handler with streams and back pressure
- add remaining virtual methods to base strategy
X command queue timer keeps running preventing clean shutdowns, so disable timer when no commands

low
---
X eliminate callbacks on command writes
- fix bug in tcp network cubelet client (when multiple clients running?)