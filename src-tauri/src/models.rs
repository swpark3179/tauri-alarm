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
