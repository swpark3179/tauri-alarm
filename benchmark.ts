import { performance } from "perf_hooks";

// Mock alarm types to match the app
type Alarm = {
  id: string;
  name: string;
  time: string;
};

// Generate test data
const NUM_ALARMS = 10000;
const alarms: Alarm[] = Array.from({ length: NUM_ALARMS }, (_, i) => ({
  id: `alarm-${i}`,
  name: `Alarm ${i}`,
  time: "12:00",
}));

// We'll update an alarm near the end to maximize traversal time
const targetAlarm: Alarm = {
  id: `alarm-${NUM_ALARMS - 1}`,
  name: `Updated Alarm ${NUM_ALARMS - 1}`,
  time: "13:00",
};

// Old approach (find + map)
function oldApproach(alarms: Alarm[], alarm: Alarm): Alarm[] {
  const existing = alarms.find((a) => a.id === alarm.id);
  let newAlarms;
  if (existing) {
    newAlarms = alarms.map((a) => (a.id === alarm.id ? alarm : a));
  } else {
    newAlarms = [...alarms, alarm];
  }
  return newAlarms;
}

// New approach (findIndex)
function newApproach(alarms: Alarm[], alarm: Alarm): Alarm[] {
  const index = alarms.findIndex((a) => a.id === alarm.id);
  let newAlarms;
  if (index !== -1) {
    newAlarms = [...alarms];
    newAlarms[index] = alarm;
  } else {
    newAlarms = [...alarms, alarm];
  }
  return newAlarms;
}

// Warmup
for (let i = 0; i < 100; i++) {
  oldApproach(alarms, targetAlarm);
  newApproach(alarms, targetAlarm);
}

const ITERATIONS = 1000;

console.log(`Running benchmark with ${NUM_ALARMS} items and ${ITERATIONS} iterations...`);

// Benchmark old approach
let startOld = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  oldApproach(alarms, targetAlarm);
}
let endOld = performance.now();
const oldTime = endOld - startOld;

// Benchmark new approach
let startNew = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  newApproach(alarms, targetAlarm);
}
let endNew = performance.now();
const newTime = endNew - startNew;

console.log(`Old approach: ${oldTime.toFixed(2)} ms`);
console.log(`New approach: ${newTime.toFixed(2)} ms`);
console.log(`Improvement: ${((oldTime - newTime) / oldTime * 100).toFixed(2)}% faster`);
