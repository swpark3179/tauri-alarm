use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Alarm {
    pub id: String,
    pub title: String,
    pub repeat_type: RepeatType,
    pub triggers: Vec<TriggerInfo>,
    pub enabled: bool,
    pub order: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum RepeatType {
    None,
    Daily,
    Weekly,
    Monthly,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TriggerInfo {
    pub date: Option<String>,      // YYYY-MM-DD
    pub time: Option<String>,      // HH:mm
    pub days_of_week: Option<Vec<String>>, // Monday, Tuesday, etc.
    pub weeks_of_month: Option<String>, // First, Second, Third, Fourth, Last
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deserialize_alarm() {
        let json_data = r#"
        {
            "id": "123",
            "title": "Test Alarm",
            "repeat_type": "Daily",
            "triggers": [
                {
                    "time": "08:00"
                }
            ],
            "enabled": true,
            "order": 1
        }
        "#;

        let alarm: Alarm = serde_json::from_str(json_data).expect("Failed to deserialize");
        assert_eq!(alarm.id, "123");
        assert_eq!(alarm.title, "Test Alarm");
        assert_eq!(alarm.repeat_type, RepeatType::Daily);
        assert_eq!(alarm.triggers.len(), 1);
        assert_eq!(alarm.triggers[0].time, Some("08:00".to_string()));
        assert_eq!(alarm.enabled, true);
        assert_eq!(alarm.order, 1);
    }

    #[test]
    fn test_serialize_alarm() {
        let alarm = Alarm {
            id: "456".to_string(),
            title: "Weekly Meeting".to_string(),
            repeat_type: RepeatType::Weekly,
            triggers: vec![
                TriggerInfo {
                    date: None,
                    time: Some("10:00".to_string()),
                    days_of_week: Some(vec!["Monday".to_string()]),
                    weeks_of_month: None,
                }
            ],
            enabled: false,
            order: 2,
        };

        let json = serde_json::to_string(&alarm).expect("Failed to serialize");
        assert!(json.contains(r#""id":"456""#));
        assert!(json.contains(r#""title":"Weekly Meeting""#));
        assert!(json.contains(r#""repeat_type":"Weekly""#));
        assert!(json.contains(r#""time":"10:00""#));
        assert!(json.contains(r#""enabled":false"#));
        assert!(json.contains(r#""order":2"#));
    }
}
