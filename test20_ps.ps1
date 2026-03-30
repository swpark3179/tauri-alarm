$t1 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "10:00"
$Props = @{
    StartBoundary = (Get-Date "10:00").ToString("s")
    MonthsOfYear  = [uint16]4095
    DaysOfWeek    = [uint16]2
    WeeksOfMonth  = [uint16]1
}
$t2 = New-CimInstance -ClassName MSFT_TaskMonthlyDOWTrigger -Namespace Root/Microsoft/Windows/TaskScheduler -ClientOnly -Property $Props

$Action = New-ScheduledTaskAction -Execute 'cmd.exe'
# Use $t1 instead of $t2 to check if it's the trigger causing HRESULT 0x80041002
$Task = New-ScheduledTask -Action $Action -Trigger $t2
$Task.Triggers[0].PSTypeNames.Insert(0, "Microsoft.Management.Infrastructure.CimInstance#MSFT_TaskTrigger")
Register-ScheduledTask -TaskName 'TestMonthly20' -InputObject $Task
