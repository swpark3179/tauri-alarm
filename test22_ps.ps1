$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "10:00"
$Trigger.CimSystemProperties.ClassName
$Trigger.PSTypeNames
