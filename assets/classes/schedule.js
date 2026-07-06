class ScheduleEntry {
    constructor({teacher_id = null, day = '', slot_id = '', section_id = null, subject = '', room = null} = {}) {
        this.teacher_id = teacher_id;
        this.day = day; // e.g., 'Monday'
        this.slot_id = slot_id; // e.g., '08:00-09:00' or slot key
        this.section_id = section_id;
        this.subject = subject;
        this.room = room;
    }

    static fromAPI(obj = {}) {
        return new ScheduleEntry({
            teacher_id: obj.teacher_id || obj.teacher || null,
            day: obj.day || obj.weekday || '',
            slot_id: obj.slot_id || obj.slot || '',
            section_id: obj.section_id || obj.section || null,
            subject: obj.subject || '',
            room: obj.room || null
        });
    }

    toAPI() {
        return {
            teacher_id: this.teacher_id,
            day: this.day,
            slot_id: this.slot_id,
            section_id: this.section_id,
            subject: this.subject,
            room: this.room
        };
    }
}

class ScheduleCollection {
    constructor(entries = []) {
        this.entries = Array.isArray(entries) ? entries.map(e => e instanceof ScheduleEntry ? e : ScheduleEntry.fromAPI(e)) : [];
    }

    add(entry) {
        this.entries.push(entry instanceof ScheduleEntry ? entry : new ScheduleEntry(entry));
    }

    findByTeacher(teacher_id) {
        return this.entries.filter(e => e.teacher_id === teacher_id);
    }

    findBySection(section_id) {
        return this.entries.filter(e => e.section_id === section_id);
    }

    toAPIArray() {
        return this.entries.map(e => e.toAPI());
    }
}

module.exports = { ScheduleEntry, ScheduleCollection };