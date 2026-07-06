
// ============================================================
// STATIC REFERENCE DATA
// ============================================================

// Determine API base URL:
// - When the UI is opened via a file:// URL (double-clicking index.html),
//   prefer the local PHP server at http://localhost:8080 so fetch() targets
//   the running PHP dev server instead of resolving to file paths.
// - When served over HTTP (e.g. from the PHP server or Electron), use the
//   current origin.
const API_BASE = (function(){
    try {
        if (window.location && window.location.protocol === 'file:') {
            return 'http://localhost:8080/';
        }
        // Ensure origin ends with a slash
        const origin = window.location.origin || '';
        return origin.endsWith('/') ? origin : origin + '/';
    } catch (e) {
        return 'http://localhost:8080/';
    }
})();

const API = {
    schedule:    API_BASE + 'api/schedule.php',
    teachers:    API_BASE + 'api/teachers.php',
    sections:    API_BASE + 'api/sections.php',
    conflicts:   API_BASE + 'api/conflicts.php',
    stats:       API_BASE + 'api/stats.php',
    subjects:    API_BASE + 'api/subjects.php',
    strands:     API_BASE + 'api/strands.php',
    electives:   API_BASE + 'api/electives.php',
    autoSchedule:API_BASE + 'api/auto_schedule.php',
};

const GRADE_LEVELS = [
    { grade: 7,  label: 'Grade 7',  short: 'G7',  color: 'g7' },
    { grade: 8,  label: 'Grade 8',  short: 'G8',  color: 'g8' },
    { grade: 9,  label: 'Grade 9',  short: 'G9',  color: 'g9' },
    { grade: 10, label: 'Grade 10', short: 'G10', color: 'g10' },
    { grade: 11, label: 'Grade 11', short: 'G11', color: 'g11' },
    { grade: 12, label: 'Grade 12', short: 'G12', color: 'g12' },
];

// SECTIONS is now dynamic — loaded from DB at startup into this array
// It starts with the seeded defaults and gets refreshed on load
let SECTIONS = [
    { id: 'G7-WHITE',      name: 'GRADE 7 - WHITE',      grade: 7,  section: 'WHITE',      strand: null },
    { id: 'G7-CREAM',      name: 'GRADE 7 - CREAM',      grade: 7,  section: 'CREAM',      strand: null },
    { id: 'G7-INDIGO',     name: 'GRADE 7 - INDIGO',     grade: 7,  section: 'INDIGO',     strand: null },
    { id: 'G7-LILAC',      name: 'GRADE 7 - LILAC',      grade: 7,  section: 'LILAC',      strand: null },
    { id: 'G8-WISDOM',     name: 'GRADE 8 - WISDOM',     grade: 8,  section: 'WISDOM',     strand: null },
    { id: 'G8-INTEGRITY',  name: 'GRADE 8 - INTEGRITY',  grade: 8,  section: 'INTEGRITY',  strand: null },
    { id: 'G9-WILLIAMS',   name: 'GRADE 9 - ST. WILLIAM',grade: 9,  section: 'ST. WILLIAM',strand: null },
    { id: 'G9-CLAIRE',     name: 'GRADE 9 - ST. CLAIRE', grade: 9,  section: 'ST. CLAIRE', strand: null },
    { id: 'G9-ISIDORE',    name: 'GRADE 9 - ST. ISIDORE',grade: 9,  section: 'ST. ISIDORE',strand: null },
    { id: 'G10-WISTERIA',  name: 'GRADE 10 - WISTERIA',  grade: 10, section: 'WISTERIA',   strand: null },
    { id: 'G10-CARNATION', name: 'GRADE 10 - CARNATION', grade: 10, section: 'CARNATION',  strand: null },
    { id: 'G11-ABM-ASSETS',   name: 'GRADE 11 - ABM ASSETS',   grade: 11, section: 'ASSETS',   strand: 'ABM' },
    { id: 'G11-ABM-BROKERS',  name: 'GRADE 11 - ABM BROKERS',  grade: 11, section: 'BROKERS',  strand: 'ABM' },
    { id: 'G11-ABM-CAPITALS', name: 'GRADE 11 - ABM CAPITALS', grade: 11, section: 'CAPITALS', strand: 'ABM' },
    { id: 'G11-HUMSS-AQUINAS', name: 'GRADE 11 - HUMSS AQUINAS', grade: 11, section: 'AQUINAS', strand: 'HUMSS' },
    { id: 'G11-HUMSS-BACON',   name: 'GRADE 11 - HUMSS BACON',   grade: 11, section: 'BACON',   strand: 'HUMSS' },
    { id: 'G11-HUMSS-CONFUCIUS',name:'GRADE 11 - HUMSS CONFUCIUS',grade:11, section:'CONFUCIUS', strand:'HUMSS' },
    { id: 'G11-HUMSS-DEWEY',   name: 'GRADE 11 - HUMSS DEWEY',   grade: 11, section: 'DEWEY',   strand: 'HUMSS' },
    { id: 'G11-HUMSS-EPICTUS', name: 'GRADE 11 - HUMSS EPICTUS', grade: 11, section: 'EPICTUS', strand: 'HUMSS' },
    { id: 'G11-HUMSS-FROBEL',  name: 'GRADE 11 - HUMSS FROBEL',  grade: 11, section: 'FROBEL',  strand: 'HUMSS' },
    { id: 'G11-HUMSS-GALILEI', name: 'GRADE 11 - HUMSS GALILEI', grade: 11, section: 'GALILEI', strand: 'HUMSS' },
    { id: 'G11-HUMSS-HOBBES',  name: 'GRADE 11 - HUMSS HOBBES',  grade: 11, section: 'HOBBES',  strand: 'HUMSS' },
    { id: 'G11-HUMSS-ISRAELI', name: 'GRADE 11 - HUMSS ISRAELI', grade: 11, section: 'ISRAELI', strand: 'HUMSS' },
    { id: 'G11-HUMSS-JACOBE',  name: 'GRADE 11 - HUMSS JACOBE',  grade: 11, section: 'JACOBE',  strand: 'HUMSS' },
    { id: 'G11-STEM-ARGON',    name: 'GRADE 11 - STEM ARGON',    grade: 11, section: 'ARGON',   strand: 'STEM' },
    { id: 'G11-STEM-BROMINE',  name: 'GRADE 11 - STEM BROMINE',  grade: 11, section: 'BROMINE', strand: 'STEM' },
    { id: 'G11-STEM-COPPER',   name: 'GRADE 11 - STEM COPPER',   grade: 11, section: 'COPPER',  strand: 'STEM' },
    { id: 'G11-STEM-DUBNIUM',  name: 'GRADE 11 - STEM DUBNIUM',  grade: 11, section: 'DUBNIUM', strand: 'STEM' },
    { id: 'G11-STEM-EUROPIUM', name: 'GRADE 11 - STEM EUROPIUM', grade: 11, section: 'EUROPIUM',strand: 'STEM' },
    { id: 'G11-STEM-FLUORINE', name: 'GRADE 11 - STEM FLUORINE', grade: 11, section: 'FLUORINE',strand: 'STEM' },
    { id: 'G11-STEM-GALLIUM',  name: 'GRADE 11 - STEM GALLIUM',  grade: 11, section: 'GALLIUM', strand: 'STEM' },
    { id: 'G11-STEM-HELIUM',   name: 'GRADE 11 - STEM HELIUM',   grade: 11, section: 'HELIUM',  strand: 'STEM' },
    { id: 'G11-TVL-ANCHOVIES', name: 'GRADE 11 - TVL ANCHOVIES', grade: 11, section: 'ANCHOVIES',strand:'TVL' },
    { id: 'G11-TVL-BARLEY',    name: 'GRADE 11 - TVL BARLEY',    grade: 11, section: 'BARLEY',  strand: 'TVL' },
    { id: 'G11-TVL-CAVIAR',    name: 'GRADE 11 - TVL CAVIAR',    grade: 11, section: 'CAVIAR',  strand: 'TVL' },
    { id: 'G11-TVL-DILL',      name: 'GRADE 11 - TVL DILL',      grade: 11, section: 'DILL',    strand: 'TVL' },
    { id: 'G12-ABM-AGENTS',    name: 'GRADE 12 - ABM AGENTS',    grade: 12, section: 'AGENTS',  strand: 'ABM' },
    { id: 'G12-ABM-BANKERS',   name: 'GRADE 12 - ABM BANKERS',   grade: 12, section: 'BANKERS', strand: 'ABM' },
    { id: 'G12-ABM-CREDITORS', name: 'GRADE 12 - ABM CREDITORS', grade: 12, section: 'CREDITORS',strand:'ABM' },
    { id: 'G12-HUMSS-AUGUSTINE',name:'GRADE 12 - HUMSS AUGUSTINE',grade:12, section:'AUGUSTINE', strand:'HUMSS'},
    { id: 'G12-HUMSS-BINET',   name: 'GRADE 12 - HUMSS BINET',   grade: 12, section: 'BINET',   strand: 'HUMSS'},
    { id: 'G12-HUMSS-COMENIUS',name:'GRADE 12 - HUMSS COMENIUS',  grade:12, section:'COMENIUS',  strand:'HUMSS'},
    { id: 'G12-HUMSS-DESCARTES',name:'GRADE 12 - HUMSS DESCARTES',grade:12, section:'DESCARTES', strand:'HUMSS'},
    { id: 'G12-HUMSS-EPICURUS',name:'GRADE 12 - HUMSS EPICURUS',  grade:12, section:'EPICURUS',  strand:'HUMSS'},
    { id: 'G12-HUMSS-FREUD',   name: 'GRADE 12 - HUMSS FREUD',   grade: 12, section: 'FREUD',   strand: 'HUMSS'},
    { id: 'G12-HUMSS-GANDHI',  name: 'GRADE 12 - HUMSS GANDHI',  grade: 12, section: 'GANDHI',  strand: 'HUMSS'},
    { id: 'G12-HUMSS-HERACLITUS',name:'GRADE 12 - HUMSS HERACLITUS',grade:12,section:'HERACLITUS',strand:'HUMSS'},
    { id: 'G12-HUMSS-IGNATIUS',name:'GRADE 12 - HUMSS IGNATIUS',  grade:12, section:'IGNATIUS',  strand:'HUMSS'},
    { id: 'G12-STEM-ARSENIC',  name: 'GRADE 12 - STEM ARSENIC',  grade: 12, section: 'ARSENIC',  strand: 'STEM'},
    { id: 'G12-STEM-BARIUM',   name: 'GRADE 12 - STEM BARIUM',   grade: 12, section: 'BARIUM',   strand: 'STEM'},
    { id: 'G12-STEM-CARBON',   name: 'GRADE 12 - STEM CARBON',   grade: 12, section: 'CARBON',   strand: 'STEM'},
    { id: 'G12-STEM-DYSPROSIUM',name:'GRADE 12 - STEM DYSPROSIUM',grade:12, section:'DYSPROSIUM',strand:'STEM'},
    { id: 'G12-STEM-EINSTEINIUM',name:'GRADE 12 - STEM EINSTEINIUM',grade:12,section:'EINSTEINIUM',strand:'STEM'},
    { id: 'G12-STEM-FLEROVIUM',name:'GRADE 12 - STEM FLEROVIUM',  grade:12, section:'FLEROVIUM', strand:'STEM'},
    { id: 'G12-STEM-GOLD',     name: 'GRADE 12 - STEM GOLD',     grade: 12, section: 'GOLD',     strand: 'STEM'},
    { id: 'G12-STEM-HYDROGEN', name: 'GRADE 12 - STEM HYDROGEN', grade: 12, section: 'HYDROGEN', strand: 'STEM'},
    { id: 'G12-TVL-AMARETTO',  name: 'GRADE 12 - TVL AMARETTO',  grade: 12, section: 'AMARETTO', strand: 'TVL'},
    { id: 'G12-TVL-BASIL',     name: 'GRADE 12 - TVL BASIL',     grade: 12, section: 'BASIL',    strand: 'TVL'},
    { id: 'G12-TVL-CRAISINS',  name: 'GRADE 12 - TVL CRAISINS',  grade: 12, section: 'CRAISINS', strand: 'TVL'},
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// JHS Time Slots (Grade 7–10): 7:00 AM – 4:30 PM, Mon–Fri
const TIME_SLOTS_JHS = [
    { id: 'p1',   label: '7:00 – 7:30 AM',                        type: 'period' },
    { id: 'p2',   label: '7:30 – 8:30 AM',                        type: 'period' },
    { id: 'p3',   label: '8:30 – 9:30 AM',                        type: 'period' },
    { id: 'brk1', label: '☕ BREAK (9:30 – 9:45 AM)',             type: 'break'  },
    { id: 'p4',   label: '9:45 – 10:45 AM',                       type: 'period' },
    { id: 'p5',   label: '10:45 – 11:45 AM',                      type: 'period' },
    { id: 'brk2', label: '🍽️ LUNCH (11:45 AM – 12:15 PM)',       type: 'break'  },
    { id: 'p6',   label: '12:15 – 1:15 PM',                       type: 'period' },
    { id: 'p7',   label: '1:15 – 2:15 PM',                        type: 'period' },
    { id: 'brk3', label: '☕ BREAK (2:15 – 2:30 PM)',             type: 'break'  },
    { id: 'p8',   label: '2:30 – 3:30 PM',                        type: 'period' },
    { id: 'p9',   label: '3:30 – 4:30 PM',                        type: 'period' },
];

// SHS Time Slots (Grade 11–12): 7:30 AM – 5:30 PM, Mon–Sat (no 7:00-7:30 for SHS sections)
const TIME_SLOTS_SHS = [
    { id: 'p2',   label: '7:30 – 8:30 AM',                        type: 'period' },
    { id: 'p3',   label: '8:30 – 9:30 AM',                        type: 'period' },
    { id: 'p4',   label: '9:30 – 10:30 AM',                       type: 'period' },
    { id: 'brk1', label: '☕ BREAK (10:30 – 10:45 AM)',           type: 'break'  },
    { id: 'p5',   label: '10:45 – 11:45 AM',                      type: 'period' },
    { id: 'p6',   label: '11:45 AM – 12:45 PM',                   type: 'period' },
    { id: 'brk2', label: '🍽️ LUNCH (12:45 – 1:15 PM)',           type: 'break'  },
    { id: 'p7',   label: '1:15 – 2:15 PM',                        type: 'period' },
    { id: 'p8',   label: '2:15 – 3:15 PM',                        type: 'period' },
    { id: 'brk3', label: '☕ BREAK (3:15 – 3:30 PM)',             type: 'break'  },
    { id: 'p9',   label: '3:30 – 4:30 PM',                        type: 'period' },
    { id: 'p10',  label: '4:30 – 5:30 PM',                        type: 'period' },
];

let TIME_SLOTS = TIME_SLOTS_JHS;

const PERIOD_SLOTS_JHS = TIME_SLOTS_JHS.filter(t => t.type === 'period').map(t => t.id);
const PERIOD_SLOTS_SHS = TIME_SLOTS_SHS.filter(t => t.type === 'period').map(t => t.id);

let PERIOD_SLOTS = PERIOD_SLOTS_JHS;

function getTimeSlots(grade) {
    return grade <= 10 ? TIME_SLOTS_JHS : TIME_SLOTS_SHS;
}

function getPeriodSlots(grade) {
    return grade <= 10 ? PERIOD_SLOTS_JHS : PERIOD_SLOTS_SHS;
}

// Caches — populated from DB at startup
let scheduleCache = {};
let teachersCache = [];
let subjectsCache = { jhs: [], g11Sem1: [], g11Sem2: [], g12Sem1: [], g12Sem2: [] };

// Current curriculum filter - load from localStorage or default to 'new'
window.currentCurriculum = localStorage.getItem('selectedCurriculum') || 'new';