use tauri::PhysicalPosition;

#[tauri::command]
pub async fn set_window_position(window: tauri::Window) -> Result<(), String> {
    if let Some(monitor) = window.current_monitor().map_err(|e| e.to_string())? {
        let size = window.outer_size().map_err(|e| e.to_string())?;
        let monitor_size = monitor.size();

        let x = monitor_size.width as f64 - size.width as f64 - 20.0;
        let y = monitor_size.height as f64 - size.height as f64 - 60.0; // Assume taskbar height approx 40-60px

        window
            .set_position(PhysicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}
