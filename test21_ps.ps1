$Action = New-ScheduledTaskAction -Execute "cmd.exe"
$Props = @{
    StartBoundary = (Get-Date "10:00").ToString("s")
    MonthsOfYear  = [uint16]4095
    DaysOfWeek    = [uint16]2
    WeeksOfMonth  = [uint16]1
}
$Trigger = New-CimInstance -ClassName MSFT_TaskMonthlyDOWTrigger -Namespace Root/Microsoft/Windows/TaskScheduler -ClientOnly -Property $Props
$Trigger.PSTypeNames.Insert(0, "Microsoft.Management.Infrastructure.CimInstance#Root/Microsoft/Windows/TaskScheduler/MSFT_TaskMonthlyDOWTrigger")

Register-ScheduledTask -TaskName 'TestMonthly21' -Action $Action -Trigger $Trigger
