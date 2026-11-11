"""Reproduce interim renderer in THIS checkout, then restore sources even on failure.

Run only after other V2 captures/builds finish. Never touches another checkout.
"""
import subprocess
from pathlib import Path
renderer=Path('src/render/DepthRenderer.ts')
interim=Path('src/render/abilities/InterimAbilityVisuals.ts')
saved=renderer.read_bytes()
try:
 renderer.write_bytes(subprocess.check_output(['git','show','43bafee^:src/render/DepthRenderer.ts']))
 interim.write_bytes(subprocess.check_output(['git','show','43bafee^:src/render/abilities/InterimAbilityVisuals.ts']))
 cases=','.join(f'v2-kit-{rig}-{tier}-armory' for rig in ['breacher','cryo','pyro','arc'] for tier in ['high','low'])
 subprocess.run(['npm','run','capture','--','--build','--label=v2-before-stress',f'--scenarios={cases}','--burst=4','--keep-going'],check=True)
finally:
 renderer.write_bytes(saved)
 interim.unlink(missing_ok=True)
