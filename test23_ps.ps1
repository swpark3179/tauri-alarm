$t1 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "10:00"
$Props = @{
    StartBoundary = (Get-Date "10:00").ToString("s")
    MonthsOfYear  = [uint16]4095
    DaysOfWeek    = [uint16]2
    WeeksOfMonth  = [uint16]1
}
$t2 = New-CimInstance -ClassName MSFT_TaskMonthlyDOWTrigger -Namespace Root/Microsoft/Windows/TaskScheduler -ClientOnly -Property $Props
# In a previous error, "New-ScheduledTaskTrigger : Method 'NewTriggerByOnce' not found" happened because CIM class lacked a method or something.
# For Register-ScheduledTask, it might look for a method.
# What if we just cast to the exact interface?
[Microsoft.Management.Infrastructure.CimInstance[]]$Triggers = @($t2)
$Action = New-ScheduledTaskAction -Execute 'cmd.exe'
Register-ScheduledTask -TaskName 'TestMonthly23' -Action $Action -Trigger $Triggers
