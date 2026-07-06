// request.js

class ScheduleRequest {
	constructor({teacher_id = null, section_id = null, subject = '', day = '', slot_id = '', reason = ''} = {}) {
		this.teacher_id = teacher_id;
		this.section_id = section_id;
		this.subject = subject;
		this.day = day;
		this.slot_id = slot_id;
		this.reason = reason;
	}

	toAPI() {
		return {
			teacher_id: this.teacher_id,
			section_id: this.section_id,
			subject: this.subject,
			day: this.day,
			slot_id: this.slot_id,
			reason: this.reason
		};
	}

	static fromAPI(obj = {}) {
		return new ScheduleRequest(obj);
	}
}