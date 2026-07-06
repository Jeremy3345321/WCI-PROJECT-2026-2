class Teacher {
    constructor({id = null, name = '', subject = '', subjects = [], availability = null, departments = [], employment_type = '', advisory_section = '', room_number = '', load = '', jhs_grades = null} = {}) {
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.subjects = Array.isArray(subjects) ? subjects : (subjects ? [subjects] : []);
        this.availability = availability || {};
        this.departments = Array.isArray(departments) ? departments : (departments ? [departments] : []);
        this.employment_type = employment_type;
        this.advisory_section = advisory_section;
        this.room_number = room_number;
        this.load = load;
        this.jhs_grades = jhs_grades || {};
    }

    static fromAPI(obj = {}) {
        return new Teacher({
            id: obj.id || obj.teacher_id || null,
            name: obj.name || obj.teacher_name || '',
            subject: obj.subject || '',
            subjects: parseJSONIfNeeded(obj.subjects),
            availability: parseJSONIfNeeded(obj.availability),
            departments: parseJSONIfNeeded(obj.departments) || [],
            employment_type: obj.employment_type || '',
            advisory_section: obj.advisory_section || '',
            room_number: obj.room_number || '',
            load: obj.load || '',
            jhs_grades: parseJSONIfNeeded(obj.jhs_grades) || {}
        });
    }

    toAPI() {
        return {
            id: this.id,
            name: this.name,
            subject: this.subject,
            subjects: JSON.stringify(this.subjects),
            availability: JSON.stringify(this.availability),
            departments: JSON.stringify(this.departments),
            employment_type: this.employment_type,
            advisory_section: this.advisory_section,
            room_number: this.room_number,
            load: this.load,
            jhs_grades: JSON.stringify(this.jhs_grades)
        };
    }
}

function parseJSONIfNeeded(v) {
    if (v == null) return null;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch (e) { return v; }
}