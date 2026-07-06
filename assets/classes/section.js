class Section {
	constructor({id = null, name = '', grade = null, strand = '', availability = null, room = '', section_elective_subtypes = []} = {}) {
		this.id = id;
		this.name = name;
		this.grade = grade;
		this.strand = strand;
		this.availability = availability || {};
		this.room = room;
		this.section_elective_subtypes = Array.isArray(section_elective_subtypes) ? section_elective_subtypes : (section_elective_subtypes ? [section_elective_subtypes] : []);
	}

	static fromAPI(obj = {}) {
		return new Section({
			id: obj.id || obj.section_id || null,
			name: obj.name || obj.section_name || '',
			grade: obj.grade != null ? Number(obj.grade) : null,
			strand: obj.strand || '',
			availability: parseJSONIfNeeded(obj.availability) || {},
			room: obj.room || '',
			section_elective_subtypes: parseJSONIfNeeded(obj.section_elective_subtypes) || []
		});
	}

	toAPI() {
		return {
			id: this.id,
			name: this.name,
			grade: this.grade,
			strand: this.strand,
			availability: JSON.stringify(this.availability),
			room: this.room,
			section_elective_subtypes: JSON.stringify(this.section_elective_subtypes)
		};
	}
}

function parseJSONIfNeeded(v) {
	if (v == null) return null;
	if (typeof v === 'object') return v;
	try { return JSON.parse(v); } catch (e) { return v; }
}