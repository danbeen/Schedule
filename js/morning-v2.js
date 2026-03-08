/**
 * Morning Checklist v2 – shared data and logic
 * localStorage keys prefixed with morning_v2_
 */

const PREFIX = 'morning_v2_';

const CHILD_IDS = ['kaia', 'judah'];
const CHILD_NAMES = { kaia: 'Kaia', judah: 'Judah' };

const DEFAULT_TASKS = [
  { id: 'make_bed', label: 'Make Bed', duration: 4, core: true, order: 0 },
  { id: 'get_dressed', label: 'Get Dressed', duration: 5, core: true, order: 1 },
  { id: 'breakfast', label: 'Breakfast', duration: 15, core: true, order: 2 },
  { id: 'brush_teeth', label: 'Brush Teeth', duration: 4, core: true, order: 3 },
  { id: 'sunscreen', label: 'Sunscreen', duration: 2, core: true, order: 4 },
  { id: 'socks_shoes', label: 'Socks & Shoes', duration: 3, core: true, order: 5 },
  { id: 'final_check', label: 'Final Check', duration: 4, core: true, order: 6 }
];

const DEFAULT_SETTINGS = {
  targetFinishTime: '07:30',
  weeklyUnlockThreshold: 35,
  bigPrizeJarsRequired: 3,
  timeBonusThresholds: [
    { before: '07:20', bonus: 3 },
    { before: '07:25', bonus: 2 },
    { before: '07:29', bonus: 1 }
  ],
  timeBonusEnabled: true,
  manualBonusEnabled: true,
  parentRatingEnabled: true
};

const DEFAULT_REWARDS_POOL = [
  'Choose Saturday breakfast',
  'Choose family movie',
  'Choose music in the car',
  'Choose family walk destination',
  'Stay up 20 minutes later',
  'Be dinner helper',
  'Be movie director',
  'Choose dessert one night',
  'Choose the board game',
  'One-on-one parent time'
];

const DEFAULT_REWARDS_KAIA_SMALL = [
  '10 mins extra iPad time on weekend',
  'Be the boss of a parent/tell a parent what to do for 5 mins',
  '10 mins handball time',
  'Massage/squish at bedtime',
  '10 mins Mr Squiggle drawing game',
  '10 mins extra time playing with neighbours',
  'Extra 5 mins special time with a parent',
  '10 mins extra reading time',
  '10 mins later bedtime',
  'Piece of gum',
  'Treat from treat bag',
  'Choose special snack for lunch/recess',
  'Dessert on weekend',
  'Skip a chore'
];

const DEFAULT_REWARDS_KAIA_BIG = [
  'Breakfast for dinner',
  'Choose takeaways Sat night',
  'Choose dinner out Sat night',
  '30 extra mins iPad time on weekend',
  '30 mins Nintendo time on weekend',
  'Pancakes for breakfast on weekend',
  'Choose weekend activity',
  'Have picnic dinner',
  'Movie night Sat night',
  'Going out for ice cream after school or on weekend',
  'Making s\'mores/roasting marshmallows'
];

const DEFAULT_REWARDS_JUDAH_SMALL = [
  '10 mins extra iPad time on weekend',
  'Be the boss of a parent/tell a parent what to do for 5 mins',
  '10 mins playing game of your choice',
  'Massage/squish at bedtime',
  '10 mins Mr Squiggle drawing game',
  '10 mins extra time playing with neighbours',
  '10 mins later bedtime',
  'Extra 5 mins special time with a parent',
  'Piece of gum',
  'Treat from treat bag',
  'Choose special snack for lunch/recess',
  'Dessert on weekend',
  'Skip a chore'
];

const DEFAULT_REWARDS_JUDAH_BIG = [
  'Breakfast for dinner',
  'Choose takeaways Sat night',
  'Choose dinner out Sat night',
  '30 extra mins iPad time on weekend',
  '30 mins Nintendo time on weekend',
  'Pancakes for breakfast on weekend',
  'Choose weekend activity',
  'Have picnic dinner',
  'Movie night Sat night',
  'Going out for ice cream after school or on weekend',
  'Making s\'mores/roasting marshmallows'
];

function getSettings() {
  const raw = localStorage.getItem(PREFIX + 'settings');
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

function saveSettings(settings) {
  localStorage.setItem(PREFIX + 'settings', JSON.stringify(settings));
}

function getTasks(childId) {
  var key = PREFIX + 'tasks_' + childId;
  var raw = localStorage.getItem(key);
  if (!raw && childId === 'kaia') {
    var legacy = localStorage.getItem(PREFIX + 'tasks');
    if (legacy) {
      try {
        localStorage.setItem(key, legacy);
        return JSON.parse(legacy);
      } catch (e) { /* fall through to default */ }
    }
  }
  if (!raw) {
    var defaultCopy = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    try { saveTasks(childId, defaultCopy); } catch (e) {}
    return defaultCopy;
  }
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      var defaultCopy = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      try { saveTasks(childId, defaultCopy); } catch (e) {}
      return defaultCopy;
    }
    return parsed;
  } catch (e) {
    var defaultCopy = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    try { saveTasks(childId, defaultCopy); } catch (e) {}
    return defaultCopy;
  }
}

function saveTasks(childId, tasks) {
  localStorage.setItem(PREFIX + 'tasks_' + childId, JSON.stringify(tasks));
}

function formatDateKey(date) {
  var d = date instanceof Date ? date : (typeof date === 'string' ? new Date(date + 'T12:00:00') : new Date());
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getTodayKey() {
  if (typeof window !== 'undefined' && window.MORNING_V2_TODAY_OVERRIDE) {
    return window.MORNING_V2_TODAY_OVERRIDE;
  }
  return formatDateKey(new Date());
}

function normalizeDailyRecord(o) {
  if (!o || typeof o !== 'object') return { tasksCompleted: {}, parentRating: null, manualBonus: 0 };
  return {
    tasksCompleted: o.tasksCompleted && typeof o.tasksCompleted === 'object' ? o.tasksCompleted : {},
    parentRating: o.parentRating != null && typeof o.parentRating === 'number' ? o.parentRating : null,
    manualBonus: typeof o.manualBonus === 'number' ? o.manualBonus : (parseInt(o.manualBonus, 10) || 0)
  };
}

function getDailyRecord(childId, dateKey) {
  var key = PREFIX + 'daily_' + childId + '_' + dateKey;
  var raw = localStorage.getItem(key);
  if (!raw && childId === 'kaia') {
    var legacyRaw = localStorage.getItem(PREFIX + 'daily_' + dateKey);
    if (legacyRaw) {
      try {
        var legacyObj = JSON.parse(legacyRaw);
        var normalized = normalizeDailyRecord(legacyObj);
        localStorage.setItem(key, JSON.stringify(normalized));
        return normalized;
      } catch (e) {
        var def = { tasksCompleted: {}, parentRating: null, manualBonus: 0 };
        localStorage.setItem(key, JSON.stringify(def));
        return def;
      }
    }
  }
  if (!raw) return { tasksCompleted: {}, parentRating: null, manualBonus: 0 };
  try {
    var o = JSON.parse(raw);
    return normalizeDailyRecord(o);
  } catch (e) {
    return { tasksCompleted: {}, parentRating: null, manualBonus: 0 };
  }
}

function saveDailyRecord(childId, dateKey, record) {
  var toSave = normalizeDailyRecord(record || {});
  localStorage.setItem(PREFIX + 'daily_' + childId + '_' + dateKey, JSON.stringify(toSave));
}

function getRewardsConfig() {
  var raw = localStorage.getItem(PREFIX + 'rewards_config');
  if (!raw) {
    return {
      kaia: { small: DEFAULT_REWARDS_KAIA_SMALL.slice(), big: DEFAULT_REWARDS_KAIA_BIG.slice() },
      judah: { small: DEFAULT_REWARDS_JUDAH_SMALL.slice(), big: DEFAULT_REWARDS_JUDAH_BIG.slice() }
    };
  }
  var o = JSON.parse(raw);
  if (!o.kaia || !o.kaia.small) o.kaia = { small: DEFAULT_REWARDS_KAIA_SMALL.slice(), big: (o.kaia && o.kaia.big) ? o.kaia.big : DEFAULT_REWARDS_KAIA_BIG.slice() };
  if (!o.kaia.big || !o.kaia.big.length) o.kaia.big = DEFAULT_REWARDS_KAIA_BIG.slice();
  if (!o.judah || !o.judah.small) o.judah = { small: DEFAULT_REWARDS_JUDAH_SMALL.slice(), big: (o.judah && o.judah.big) ? o.judah.big : DEFAULT_REWARDS_JUDAH_BIG.slice() };
  if (!o.judah.big || !o.judah.big.length) o.judah.big = DEFAULT_REWARDS_JUDAH_BIG.slice();
  return o;
}

function saveRewardsConfig(config) {
  localStorage.setItem(PREFIX + 'rewards_config', JSON.stringify(config));
}

function getRewardsActive() {
  var raw = localStorage.getItem(PREFIX + 'rewards_active');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function setRewardsActive(active) {
  localStorage.setItem(PREFIX + 'rewards_active', JSON.stringify(active));
}

function ensureActiveRewardsForWeek() {
  var weekKey = getWeekKey(getTodayKey());
  var active = getRewardsActive();
  if (active && active.weekKey === weekKey) return active;
  return randomiseActiveRewards();
}

function setActiveRewardItem(childId, type, index, value) {
  var active = getRewardsActive();
  var weekKey = getWeekKey(getTodayKey());
  if (!active || active.weekKey !== weekKey) active = ensureActiveRewardsForWeek();
  if (!active[childId]) active[childId] = { small: [], big: '' };
  if (type === 'small' && active[childId].small && index >= 0 && index < active[childId].small.length) {
    active[childId].small[index] = value;
  } else if (type === 'big') {
    active[childId].big = value;
  }
  setRewardsActive(active);
}

function getClaimedInLastFourWeeks(childId) {
  var history = getClaimHistory(childId);
  var fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  var out = {};
  history.forEach(function (entry) {
    try {
      var d = new Date(entry.at);
      if (d >= fourWeeksAgo && entry.choice) out[entry.choice] = true;
    } catch (e) {}
  });
  return out;
}

function randomChoiceFrom(arr, excludeSet, count) {
  var pool = arr.filter(function (x) { return !excludeSet[x]; });
  if (pool.length === 0) pool = arr.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, count);
}

function randomiseActiveRewards() {
  var config = getRewardsConfig();
  var weekKey = getWeekKey(getTodayKey());
  var active = { weekKey: weekKey, kaia: { small: [], big: '' }, judah: { small: [], big: '' } };

  CHILD_IDS.forEach(function (cid) {
    var excluded = getClaimedInLastFourWeeks(cid);
    var smallPool = (config[cid] && config[cid].small) ? config[cid].small : [];
    active[cid].small = randomChoiceFrom(smallPool, excluded, 5);
  });

  var kaiaBig = (config.kaia && config.kaia.big) ? config.kaia.big : DEFAULT_REWARDS_KAIA_BIG;
  var judahBig = (config.judah && config.judah.big) ? config.judah.big : DEFAULT_REWARDS_JUDAH_BIG;
  var k = kaiaBig[Math.floor(Math.random() * kaiaBig.length)];
  var j = judahBig[Math.floor(Math.random() * judahBig.length)];
  while (j === k && kaiaBig.length > 1 && judahBig.length > 1) {
    j = judahBig[Math.floor(Math.random() * judahBig.length)];
  }
  active.kaia.big = k;
  active.judah.big = j;

  setRewardsActive(active);
  return active;
}

function getRewards() {
  var raw = localStorage.getItem(PREFIX + 'rewards');
  if (!raw) return { masterPool: [...DEFAULT_REWARDS_POOL], activeThisWeek: DEFAULT_REWARDS_POOL.slice(0, 5), chosenThisWeek: { kaia: null, judah: null } };
  var o = JSON.parse(raw);
  if (!o.masterPool || o.masterPool.length === 0) o.masterPool = [...DEFAULT_REWARDS_POOL];
  if (!o.activeThisWeek || o.activeThisWeek.length === 0) o.activeThisWeek = o.masterPool.slice(0, 5);
  if (typeof o.chosenThisWeek !== 'object' || o.chosenThisWeek === null) {
    o.chosenThisWeek = { kaia: o.chosenThisWeek || null, judah: null };
  }
  if (!o.chosenThisWeek.kaia) o.chosenThisWeek.kaia = null;
  if (!o.chosenThisWeek.judah) o.chosenThisWeek.judah = null;
  return o;
}

function saveRewards(rewards) {
  localStorage.setItem(PREFIX + 'rewards', JSON.stringify(rewards));
}

function getWeekKey(date) {
  var d = typeof date === 'string' ? new Date(date + 'T12:00:00') : (date instanceof Date ? date : new Date());
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  var monday = new Date(d.getFullYear(), d.getMonth(), diff);
  return formatDateKey(monday);
}

function getMondayOfWeek(dateKey) {
  return new Date(dateKey + 'T12:00:00');
}

function getWeekDates(dateKey) {
  const monday = getMondayOfWeek(dateKey);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push(formatDateKey(d));
  }
  return out;
}

function getCompletionHistory(childId) {
  var key = PREFIX + 'completionHistory_' + childId;
  var raw = localStorage.getItem(key);
  if (!raw && childId === 'kaia') {
    var legacy = localStorage.getItem(PREFIX + 'completionHistory');
    if (legacy) {
      localStorage.setItem(key, legacy);
      return JSON.parse(legacy);
    }
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

function saveCompletionHistory(childId, history) {
  localStorage.setItem(PREFIX + 'completionHistory_' + childId, JSON.stringify(history));
}

function getEffectiveDuration(childId, taskId, defaultMinutes) {
  var history = getCompletionHistory(childId);
  var list = history[taskId];
  if (!list || list.length === 0) return defaultMinutes;
  var valid = list.filter(function (m) { return m >= 0.5 && m <= defaultMinutes * 3; });
  if (valid.length === 0) return defaultMinutes;
  valid.sort(function (a, b) { return a - b; });
  var mid = Math.floor(valid.length / 2);
  var median = valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  return Math.round(median * 10) / 10;
}

function recordCompletionForAdaptive(childId, dateKey, taskId, prevCompletionTime, defaultDuration) {
  var now = new Date();
  var currentMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  if (!prevCompletionTime) return;
  var prev = prevCompletionTime.split(':');
  var prevMins = parseInt(prev[0], 10) * 60 + parseInt(prev[1], 10);
  var durationMins = (currentMins - prevMins);
  if (durationMins < 0) durationMins += 24 * 60;
  if (durationMins < 0.5 || durationMins > defaultDuration * 3) return;
  var history = getCompletionHistory(childId);
  history[taskId] = history[taskId] || [];
  history[taskId].push(durationMins);
  if (history[taskId].length > 30) history[taskId] = history[taskId].slice(-30);
  saveCompletionHistory(childId, history);
}

function markTaskDone(childId, dateKey, taskId) {
  var record = getDailyRecord(childId, dateKey);
  var tasks = getTasks(childId);
  var task = tasks.find(function (t) { return t.id === taskId; });
  var now = new Date();
  var timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  var completedOrder = Object.keys(record.tasksCompleted).sort(function (a, b) {
    return record.tasksCompleted[a].time.localeCompare(record.tasksCompleted[b].time);
  });
  var lastCompleted = completedOrder.length ? record.tasksCompleted[completedOrder[completedOrder.length - 1]].time : null;
  if (task) recordCompletionForAdaptive(childId, dateKey, taskId, lastCompleted, task.duration);
  record.tasksCompleted[taskId] = { time: timeStr };
  saveDailyRecord(childId, dateKey, record);
}

function getCompletedTaskIds(childId, dateKey) {
  return Object.keys(getDailyRecord(childId, dateKey).tasksCompleted);
}

function getRunwayState(childId, dateKey, nowOverride) {
  var settings = getSettings();
  var tasks = getTasks(childId).filter(function (t) { return t.core; }).sort(function (a, b) { return a.order - b.order; });
  var completedIds = getCompletedTaskIds(childId, dateKey);
  var remaining = tasks.filter(function (t) { return !completedIds.includes(t.id); });
  var target = settings.targetFinishTime;
  var now = nowOverride instanceof Date ? nowOverride : new Date();
  var targetToday = new Date(now);
  var parts = target.split(':').map(Number);
  targetToday.setHours(parts[0], parts[1], 0, 0);
  var timeLeftMins = (targetToday - now) / (60 * 1000);
  if (timeLeftMins < 0) timeLeftMins = 0;
  var estimatedMins = 0;
  remaining.forEach(function (t) {
    estimatedMins += t.duration;
  });
  var status = 'On Track';
  if (remaining.length === 0) status = 'Ahead';
  else if (timeLeftMins > 0 && estimatedMins > timeLeftMins) status = 'Behind';
  else if (timeLeftMins > 0 && estimatedMins <= timeLeftMins * 0.8) status = 'Ahead';

  var suggestedNextTaskMinutes = null;
  var suggestedNextTaskLabel = null;
  if (status === 'Behind' && remaining.length > 0) {
    var first = remaining[0];
    var firstEst = first.duration;
    var restEst = estimatedMins - firstEst;
    var timeForFirst = timeLeftMins - restEst;
    if (timeForFirst < firstEst && timeForFirst >= 1) {
      suggestedNextTaskMinutes = Math.round(timeForFirst);
      suggestedNextTaskLabel = first.label;
    }
  }

  return {
    timeLeftMins: Math.round(timeLeftMins),
    estimatedMins: Math.round(estimatedMins),
    status: status,
    targetFinishTime: target,
    remainingCount: remaining.length,
    suggestedNextTaskMinutes: suggestedNextTaskMinutes,
    suggestedNextTaskLabel: suggestedNextTaskLabel
  };
}

function getNextTaskId(childId, dateKey) {
  var tasks = getTasks(childId).filter(function (t) { return t.core; }).sort(function (a, b) { return a.order - b.order; });
  var completed = getCompletedTaskIds(childId, dateKey);
  var next = tasks.find(function (t) { return !completed.includes(t.id); });
  return next ? next.id : null;
}

function getRemainingTasks(childId, dateKey) {
  var tasks = getTasks(childId).filter(function (t) { return t.core; }).sort(function (a, b) { return a.order - b.order; });
  var completed = getCompletedTaskIds(childId, dateKey);
  return tasks.filter(function (t) { return !completed.includes(t.id); });
}

function getCompletedTasksOrdered(childId, dateKey) {
  var tasks = getTasks(childId).filter(function (t) { return t.core; }).sort(function (a, b) { return a.order - b.order; });
  var record = getDailyRecord(childId, dateKey);
  var completed = tasks.filter(function (t) { return record.tasksCompleted[t.id]; });
  completed.sort(function (a, b) {
    return record.tasksCompleted[a.id].time.localeCompare(record.tasksCompleted[b.id].time);
  });
  return completed;
}

function getTimeLeftBonus(childId, dateKey) {
  var settings = getSettings();
  if (!settings.timeBonusEnabled) return 0;
  var record = getDailyRecord(childId, dateKey);
  var tasks = getTasks(childId).filter(function (t) { return t.core; });
  var completed = getCompletedTaskIds(childId, dateKey);
  if (completed.length < tasks.length) return 0;
  var lastTime = Object.keys(record.tasksCompleted).reduce(function (latest, id) {
    var o = record.tasksCompleted[id].time;
    return !latest || o > latest ? o : latest;
  }, null);
  if (!lastTime) return 0;
  var parts = lastTime.split(':').map(Number);
  var lastMins = parts[0] * 60 + parts[1];
  var thresholds = (settings.timeBonusThresholds || []).slice().sort(function (a, b) {
    var ah = a.before.split(':').map(Number);
    var bh = b.before.split(':').map(Number);
    return (ah[0] * 60 + ah[1]) - (bh[0] * 60 + bh[1]);
  });
  for (var i = 0; i < thresholds.length; i++) {
    var th = thresholds[i].before.split(':').map(Number);
    var limit = th[0] * 60 + th[1];
    if (lastMins <= limit) return thresholds[i].bonus;
  }
  return 0;
}

// Max points a child can earn from task-clicks alone (one per task).
// Parent bonuses/penalties are NOT capped — they add/subtract on top freely.
var DAILY_POINTS_CAP = 7;

function getDailyScore(childId, dateKey) {
  var record = getDailyRecord(childId, dateKey);
  var tasks = getTasks(childId).filter(function (t) { return t.core; });
  // Task points are naturally limited to the number of core tasks (≤ 7).
  var taskPoints = 0;
  Object.keys(record.tasksCompleted).forEach(function (id) {
    if (tasks.some(function (t) { return t.id === id; })) taskPoints += 1;
  });
  var ratingBonus = (record.parentRating != null && typeof record.parentRating === 'number') ? record.parentRating : 0;
  var timeBonus = getTimeLeftBonus(childId, dateKey);
  // manualBonus is set by parent and is uncapped (can be negative to take points away).
  var manual = typeof record.manualBonus === 'number' ? record.manualBonus : 0;
  return taskPoints + ratingBonus + timeBonus + manual;
}

function getWeeklyScore(childId, weekMondayKey) {
  var dates = getWeekDates(weekMondayKey);
  var total = 0;
  dates.forEach(function (dk) { total += getDailyScore(childId, dk); });
  return total;
}

function getJarBank(childId) {
  var raw = localStorage.getItem(PREFIX + 'jarBank_' + childId);
  return raw !== null ? parseInt(raw, 10) : 0;
}

function setJarBank(childId, n) {
  localStorage.setItem(PREFIX + 'jarBank_' + childId, String(Math.max(0, n)));
}

function getClaimedThisWeek(childId) {
  var raw = localStorage.getItem(PREFIX + 'claimedThisWeek_' + childId);
  return raw !== null ? parseInt(raw, 10) : 0;
}

function setClaimedThisWeek(childId, n) {
  localStorage.setItem(PREFIX + 'claimedThisWeek_' + childId, String(Math.max(0, n)));
}

function getLastProcessedWeek(childId) {
  return localStorage.getItem(PREFIX + 'lastProcessedWeek_' + childId);
}

function setLastProcessedWeek(childId, weekKey) {
  localStorage.setItem(PREFIX + 'lastProcessedWeek_' + childId, weekKey || '');
}

function getJarState(childId) {
  var settings = getSettings();
  var threshold = settings.weeklyUnlockThreshold || 35;
  var currentWeekKey = getWeekKey(getTodayKey());
  var currentScore = getWeeklyScore(childId, currentWeekKey);
  var lastProcessed = getLastProcessedWeek(childId);
  var jarBank = getJarBank(childId);
  var claimedThisWeek = getClaimedThisWeek(childId);

  if (lastProcessed !== null && lastProcessed !== '' && lastProcessed !== currentWeekKey) {
    var lastWeekScore = getWeeklyScore(childId, lastProcessed);
    var jarsFromLastWeek = Math.floor(lastWeekScore / threshold) - claimedThisWeek;
    if (jarsFromLastWeek > 0) jarBank += jarsFromLastWeek;
    setJarBank(childId, jarBank);
    setClaimedThisWeek(childId, 0);
    setLastProcessedWeek(childId, currentWeekKey);
    claimedThisWeek = 0;
  } else if (lastProcessed === null || lastProcessed === '') {
    setLastProcessedWeek(childId, currentWeekKey);
  }

  // jarsFromThisWeek must be >= 0 (parent penalties can't remove already-earned jars mid-week)
  var jarsFromThisWeek = Math.max(0, Math.floor(currentScore / threshold));
  var totalClaimable = Math.max(0, jarBank + (jarsFromThisWeek - claimedThisWeek));
  // progressToNext is always 0–threshold even if currentScore is negative
  var progressToNext = currentScore >= 0 ? currentScore % threshold : 0;

  return {
    totalClaimable: totalClaimable,
    jarBank: jarBank,
    claimedThisWeek: claimedThisWeek,
    currentWeekScore: currentScore,
    progressToNext: progressToNext,
    pointsToNextJar: threshold - progressToNext,
    threshold: threshold
  };
}

function claimJar(childId) {
  var state = getJarState(childId);
  if (state.totalClaimable <= 0) return false;
  var threshold = state.threshold || 35;
  var currentScore = state.currentWeekScore;
  var jarsFromThisWeek = Math.floor(currentScore / threshold);
  var claimedThisWeek = getClaimedThisWeek(childId);
  if (jarsFromThisWeek - claimedThisWeek > 0) {
    setClaimedThisWeek(childId, claimedThisWeek + 1);
  } else {
    setJarBank(childId, getJarBank(childId) - 1);
  }
  return true;
}

var SAVE_FOR_BIG_PRIZE = 'Save for a big prize';

function getSavedForBigPrizeCount(childId) {
  var raw = localStorage.getItem(PREFIX + 'savedForBigPrize_' + childId);
  return raw !== null ? parseInt(raw, 10) : 0;
}

function setSavedForBigPrizeCount(childId, n) {
  localStorage.setItem(PREFIX + 'savedForBigPrize_' + childId, String(Math.max(0, n)));
}

function getClaimHistory(childId) {
  var raw = localStorage.getItem(PREFIX + 'claimHistory_' + childId);
  if (!raw) return [];
  try {
    var arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function recordClaim(childId, choice) {
  var history = getClaimHistory(childId);
  history.push({ at: new Date().toISOString(), choice: choice });
  localStorage.setItem(PREFIX + 'claimHistory_' + childId, JSON.stringify(history));
}

function resetSavedForBigPrize(childId) {
  setSavedForBigPrizeCount(childId, 0);
}

function resetJarState(childId) {
  setJarBank(childId, 0);
  setClaimedThisWeek(childId, 0);
  setLastProcessedWeek(childId, '');
}

function resetClaimHistory(childId) {
  localStorage.setItem(PREFIX + 'claimHistory_' + childId, '[]');
}

function getWeeklyUnlockState(childId) {
  var state = getJarState(childId);
  var settings = getSettings();
  var threshold = settings.weeklyUnlockThreshold || 35;
  var chosen = getActiveBigReward(childId) || null;
  return {
    score: state.currentWeekScore,
    threshold: threshold,
    unlocked: state.totalClaimable > 0,
    chosen: chosen,
    jarState: state
  };
}

function getActiveRewards(childId) {
  var active = ensureActiveRewardsForWeek();
  if (active[childId] && active[childId].small && active[childId].small.length > 0) {
    return active[childId].small;
  }
  var config = getRewardsConfig();
  var fallback = (config[childId] && config[childId].small) ? config[childId].small.slice(0, 5) : [];
  return fallback.length ? fallback : [];
}

function getActiveBigReward(childId) {
  var active = ensureActiveRewardsForWeek();
  if (active[childId] && active[childId].big) return active[childId].big;
  var config = getRewardsConfig();
  var big = (config[childId] && config[childId].big) ? config[childId].big : [];
  return big.length ? big[0] : '';
}

function getBigPrizesList(childId) {
  var config = getRewardsConfig();
  return (config[childId] && config[childId].big) ? config[childId].big.slice() : [];
}

var SYNC_EXCLUDE_KEYS = [PREFIX + 'household_id', PREFIX + 'child_id'];

function getFullState() {
  var state = {};
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.startsWith(PREFIX) && SYNC_EXCLUDE_KEYS.indexOf(k) === -1) {
      state[k] = localStorage.getItem(k);
    }
  }
  return state;
}

function setFullState(state) {
  if (!state || typeof state !== 'object') return;
  Object.keys(state).forEach(function (k) {
    if (k.startsWith(PREFIX) && SYNC_EXCLUDE_KEYS.indexOf(k) === -1) {
      try {
        localStorage.setItem(k, state[k]);
      } catch (e) { /* quota or invalid */ }
    }
  });
}

if (typeof window !== 'undefined') {
  window.MorningV2 = {
    PREFIX: PREFIX,
    CHILD_IDS: CHILD_IDS,
    CHILD_NAMES: CHILD_NAMES,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getTasks: getTasks,
    saveTasks: saveTasks,
    getTodayKey: getTodayKey,
    getDailyRecord: getDailyRecord,
    saveDailyRecord: saveDailyRecord,
    getRewards: getRewards,
    saveRewards: saveRewards,
    getRewardsConfig: getRewardsConfig,
    saveRewardsConfig: saveRewardsConfig,
    getRewardsActive: getRewardsActive,
    setRewardsActive: setRewardsActive,
    ensureActiveRewardsForWeek: ensureActiveRewardsForWeek,
    setActiveRewardItem: setActiveRewardItem,
    randomiseActiveRewards: randomiseActiveRewards,
    getActiveBigReward: getActiveBigReward,
    getBigPrizesList: getBigPrizesList,
    DAILY_POINTS_CAP: DAILY_POINTS_CAP,
    getWeekKey: getWeekKey,
    getWeekDates: getWeekDates,
    getCompletionHistory: getCompletionHistory,
    getEffectiveDuration: getEffectiveDuration,
    markTaskDone: markTaskDone,
    getCompletedTaskIds: getCompletedTaskIds,
    getRunwayState: getRunwayState,
    getNextTaskId: getNextTaskId,
    getRemainingTasks: getRemainingTasks,
    getCompletedTasksOrdered: getCompletedTasksOrdered,
    getTimeLeftBonus: getTimeLeftBonus,
    getDailyScore: getDailyScore,
    getWeeklyScore: getWeeklyScore,
    getJarState: getJarState,
    claimJar: claimJar,
    getSavedForBigPrizeCount: getSavedForBigPrizeCount,
    setSavedForBigPrizeCount: setSavedForBigPrizeCount,
    getClaimHistory: getClaimHistory,
    recordClaim: recordClaim,
    resetSavedForBigPrize: resetSavedForBigPrize,
    resetJarState: resetJarState,
    resetClaimHistory: resetClaimHistory,
    DAILY_POINTS_CAP: DAILY_POINTS_CAP,
    SAVE_FOR_BIG_PRIZE: SAVE_FOR_BIG_PRIZE,
    getWeeklyUnlockState: getWeeklyUnlockState,
    getActiveRewards: getActiveRewards,
    getFullState: getFullState,
    setFullState: setFullState,
    formatDateKey: formatDateKey,
    DEFAULT_TASKS: DEFAULT_TASKS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    DEFAULT_REWARDS_POOL: DEFAULT_REWARDS_POOL
  };
}
