"""Use an available desktop Cycles GPU; CPU remains a portable authoring fallback."""
def choose_render_device(scene):
    import bpy
    preferences=bpy.context.preferences.addons['cycles'].preferences
    for backend in ['METAL','OPTIX','CUDA','HIP','ONEAPI']:
        try:
            preferences.compute_device_type=backend
            preferences.get_devices()
        except (TypeError,RuntimeError):
            continue
        devices=[device for device in preferences.devices if device.type==backend]
        if devices:
            for device in preferences.devices:device.use=device in devices
            scene.cycles.device='GPU'
            print('K10 authoring device:',backend,[device.name for device in devices],flush=True)
            return backend
    scene.cycles.device='CPU'
    print('K10 authoring device: CPU',flush=True)
    return 'CPU'
