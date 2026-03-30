$t1 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "10:00"
$Props = @{
    StartBoundary = (Get-Date "10:00").ToString("s")
    MonthsOfYear  = [uint16]4095
    DaysOfWeek    = [uint16]2
    WeeksOfMonth  = [uint16]1
}
$t2 = New-CimInstance -ClassName MSFT_TaskMonthlyDOWTrigger -Namespace Root/Microsoft/Windows/TaskScheduler -ClientOnly -Property $Props
$t2.PSTypeNames.Insert(0, "Microsoft.Management.Infrastructure.CimInstance#MSFT_TaskTrigger")

$Action = New-ScheduledTaskAction -Execute 'cmd.exe'
# Use $t1 instead of $t2 to check if it's the trigger causing HRESULT 0x80041002
Register-ScheduledTask -TaskName 'TestMonthly18' -Action $Action -Trigger $t2 -ErrorAction Stop
