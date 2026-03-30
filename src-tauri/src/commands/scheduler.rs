use std::fmt::Write;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::Command;

use crate::models::{Alarm, RepeatType};
use std::fs;
use std::path::PathBuf;

fn get_config_file() -> PathBuf {
    let mut path = dirs::home_dir().expect("Failed to get home directory");
    path.push(".alarm");
    path.push("config.properties");
    path
}

fn get_executable_path() -> Result<String, String> {
    let config_file = get_config_file();
    if let Ok(content) = fs::read_to_string(&config_file) {
        for line in content.lines() {
            if line.starts_with("executable_path=") {
                return Ok(line.replace("executable_path=", "").trim().to_string());
            }
        }
    }
    let home_dir = dirs::home_dir().ok_or("Failed to get home directory")?;
    Ok(format!("{}\\.alarm\\Trigger.exe", home_dir.display()))
}

#[tauri::command]
pub async fn register_task(alarm: Alarm) -> Result<(), String> {
    let task_name = format!("TauriAlarm_{}", alarm.id);
    let exec_path = get_executable_path()?;
    let home_dir = dirs::home_dir().ok_or("Failed to get home directory")?;
    let working_dir = format!("{}\\.alarm", home_dir.display());

    // First, unregister if it exists to overwrite cleanly
    #[cfg(target_os = "windows")]
    let mut cmd = Command::new("powershell");
    #[cfg(not(target_os = "windows"))]
    let mut cmd = Command::new("sh");

    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    #[cfg(target_os = "windows")]
    let _ = cmd.arg("-Command")
        .arg(format!("Unregister-ScheduledTask -TaskName '{}' -TaskPath '\\AlarmManager\\' -Confirm:$false -ErrorAction SilentlyContinue", task_name))
        .output();

    let action_ps = format!("$Action = New-ScheduledTaskAction -Execute '{}' -Argument '--alarm-id {}' -WorkingDirectory '{}'", exec_path, alarm.id, working_dir);
    let settings_ps = "$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -WakeToRun -Hidden";

    let mut triggers_ps = String::new();

    match alarm.repeat_type {
        RepeatType::None => {
            if alarm.triggers.is_empty() {
                return Err("No triggers provided for one-time alarm".into());
            }
            triggers_ps.push_str("$Triggers = @(");
            for (i, t) in alarm.triggers.iter().enumerate() {
                let date = t.date.as_ref().ok_or("Missing date")?;
                let time = t.time.as_ref().ok_or("Missing time")?;
                write!(
                    &mut triggers_ps,
                    "(New-ScheduledTaskTrigger -Once -At '{}T{}')",
                    date, time
                )
                .map_err(|e| e.to_string())?;
                if i < alarm.triggers.len() - 1 {
                    triggers_ps.push_str(", ");
                }
            }
            triggers_ps.push_str(")");
        }
        RepeatType::Daily => {
            if alarm.triggers.is_empty() {
                return Err("No triggers provided".into());
            }
            let time = alarm.triggers[0].time.as_ref().ok_or("Missing time")?;
            triggers_ps = format!(
                "$Triggers = @(New-ScheduledTaskTrigger -Daily -At '{}')",
                time
            );
        }
        RepeatType::Weekly => {
            if alarm.triggers.is_empty() {
                return Err("No triggers provided".into());
            }
            let t = &alarm.triggers[0];
            let time = t.time.as_ref().ok_or("Missing time")?;
            let days_of_week = t.days_of_week.as_ref().ok_or("Missing days of week")?;
            if days_of_week.is_empty() {
                return Err("No days of week provided".into());
            }
            let days_str = days_of_week.join(", ");
            triggers_ps = format!(
                "$Triggers = @(New-ScheduledTaskTrigger -Weekly -DaysOfWeek {} -At '{}')",
                days_str, time
            );
        }
        RepeatType::Monthly => {
            // For Monthly, we need to handle Nth week of the month and specific day
            if alarm.triggers.is_empty() {
                return Err("No triggers provided".into());
            }
            let t = &alarm.triggers[0];
            let time = t.time.as_ref().ok_or("Missing time")?;
            let days_of_week = t.days_of_week.as_ref().ok_or("Missing days of week")?;
            let day_of_week = days_of_week.get(0).ok_or("Missing day of week")?;
            let week_of_month = t.weeks_of_month.as_ref().ok_or("Missing week of month")?;

            // PowerShell's ScheduledTasks module has broken support for MonthlyDOW triggers via CIM.
            // (e.g., MismatchedPSTypeName or HRESULT 0x80041002 when bypassing types).
            // We use the COM object `Schedule.Service` directly instead.

            let full_script = format!(
                r#"
$service = New-Object -ComObject 'Schedule.Service'
$service.Connect()

$folder = $service.GetFolder("\")
try {{
    $folder = $folder.GetFolder("AlarmManager")
}} catch {{
    $folder = $folder.CreateFolder("AlarmManager", $null)
}}

$taskDefinition = $service.NewTask(0)
$taskDefinition.RegistrationInfo.Description = 'Tauri Alarm Task'

$settings = $taskDefinition.Settings
$settings.StartWhenAvailable = $true
$settings.AllowStartIfOnBatteries = $true
$settings.DisallowStartIfOnBatteries = $false
$settings.StopIfGoingOnBatteries = $false
$settings.WakeToRun = $true
$settings.Hidden = $true

$action = $taskDefinition.Actions.Create(0) # TASK_ACTION_EXEC
$action.Path = '{}'
$action.Arguments = '--alarm-id {}'
$action.WorkingDirectory = '{}'

$trigger = $taskDefinition.Triggers.Create(5) # TASK_TRIGGER_MONTHLYDOW
$trigger.StartBoundary = (Get-Date "{}").ToString("s")
$trigger.MonthsOfYear = 4095 # All months

$dayStr = "{}"
$dayBitmask = 0
switch ($dayStr) {{
    "Sunday"    {{ $dayBitmask = 1 }}
    "Monday"    {{ $dayBitmask = 2 }}
    "Tuesday"   {{ $dayBitmask = 4 }}
    "Wednesday" {{ $dayBitmask = 8 }}
    "Thursday"  {{ $dayBitmask = 16 }}
    "Friday"    {{ $dayBitmask = 32 }}
    "Saturday"  {{ $dayBitmask = 64 }}
}}
$trigger.DaysOfWeek = $dayBitmask

$weekStr = "{}"
if ($weekStr -eq "Last") {{
    $trigger.RunOnLastWeekOfMonth = $true
}} else {{
    $weeks = @{{ "First"=1; "Second"=2; "Third"=4; "Fourth"=8 }}
    $trigger.WeeksOfMonth = $weeks[$weekStr]
}}

# CreateOrUpdate task
$folder.RegisterTaskDefinition('{}', $taskDefinition, 6, $null, $null, 3)
"#,
                exec_path, alarm.id, working_dir, time, day_of_week, week_of_month, task_name
            );

            #[cfg(target_os = "windows")]
            let mut cmd2 = Command::new("powershell");
            #[cfg(not(target_os = "windows"))]
            let mut cmd2 = Command::new("sh");

            #[cfg(target_os = "windows")]
            cmd2.creation_flags(0x08000000);

            let output = cmd2
                .arg("-Command")
                .arg(&full_script)
                .output()
                .map_err(|e: std::io::Error| e.to_string())?;

            if !output.status.success() {
                let err = String::from_utf8_lossy(&output.stderr);
                return Err(format!("Failed to register task: {}", err));
            }

            if !alarm.enabled {
                let _ = disable_task(alarm.id).await;
            }

            return Ok(());
        }
    }

    let register_cmd = format!("Register-ScheduledTask -TaskName '{}' -TaskPath '\\AlarmManager\\' -Action $Action -Trigger $Triggers -Settings $Settings -Description 'Tauri Alarm Task'", task_name);

    let full_script = format!(
        "{}\n{}\n{}\n{}",
        action_ps, settings_ps, triggers_ps, register_cmd
    );

    #[cfg(target_os = "windows")]
    let mut cmd2 = Command::new("powershell");
    #[cfg(not(target_os = "windows"))]
    let mut cmd2 = Command::new("sh");

    #[cfg(target_os = "windows")]
    cmd2.creation_flags(0x08000000);

    let output = cmd2
        .arg("-Command")
        .arg(&full_script)
        .output()
        .map_err(|e: std::io::Error| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to register task: {}", err));
    }

    if !alarm.enabled {
        let _ = disable_task(alarm.id).await;
    }

    Ok(())
}

#[tauri::command]
pub async fn unregister_task(id: String) -> Result<(), String> {
    let task_name = format!("TauriAlarm_{}", id);

    #[cfg(target_os = "windows")]
    let mut cmd = Command::new("powershell");
    #[cfg(not(target_os = "windows"))]
    let mut cmd = Command::new("sh");

    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let output = cmd
        .arg("-Command")
        .arg(format!(
            "Unregister-ScheduledTask -TaskName '{}' -TaskPath '\\AlarmManager\\' -Confirm:$false",
            task_name
        ))
        .output()
        .map_err(|e: std::io::Error| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to unregister task: {}", err));
    }

    Ok(())
}

#[tauri::command]
pub async fn enable_task(id: String) -> Result<(), String> {
    let task_name = format!("TauriAlarm_{}", id);
    #[cfg(target_os = "windows")]
    let mut cmd = Command::new("powershell");
    #[cfg(not(target_os = "windows"))]
    let mut cmd = Command::new("sh");

    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let output = cmd
        .arg("-Command")
        .arg(format!(
            "Enable-ScheduledTask -TaskName '{}' -TaskPath '\\AlarmManager\\'",
            task_name
        ))
        .output()
        .map_err(|e: std::io::Error| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to enable task: {}", err));
    }

    Ok(())
}

#[tauri::command]
pub async fn disable_task(id: String) -> Result<(), String> {
    let task_name = format!("TauriAlarm_{}", id);
    #[cfg(target_os = "windows")]
    let mut cmd = Command::new("powershell");
    #[cfg(not(target_os = "windows"))]
    let mut cmd = Command::new("sh");

    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let output = cmd
        .arg("-Command")
        .arg(format!(
            "Disable-ScheduledTask -TaskName '{}' -TaskPath '\\AlarmManager\\'",
            task_name
        ))
        .output()
        .map_err(|e: std::io::Error| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to disable task: {}", err));
    }

    Ok(())
}
