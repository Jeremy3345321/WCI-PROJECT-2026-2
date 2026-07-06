class Subject {
	constructor({id = null, name = '', type = '', grade = null, semester = null, term = 'all', category = '', curriculum = '', strand = '', elective_type = null, elective_subtype = null, units = 1} = {}) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.grade = grade;
		this.semester = semester;
		this.term = term;
		this.category = category;
		this.curriculum = curriculum;
		this.strand = strand;
		this.elective_type = elective_type;
		this.elective_subtype = elective_subtype;
		this.units = units;
	}

	static fromAPI(obj = {}) {
		return new Subject({
			id: obj.id || null,
			name: obj.name || '',
			type: obj.type || '',
			grade: obj.grade != null ? Number(obj.grade) : null,
			semester: obj.semester != null ? Number(obj.semester) : null,
			term: obj.term || 'all',
			category: obj.category || '',
			curriculum: obj.curriculum || '',
			strand: obj.strand || '',
			elective_type: obj.elective_type || null,
			elective_subtype: obj.elective_subtype || null,
			units: obj.units != null ? Number(obj.units) : 1
		});
	}

	toAPI() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			grade: this.grade,
			semester: this.semester,
			term: this.term,
			category: this.category,
			curriculum: this.curriculum,
			strand: this.strand,
			elective_type: this.elective_type,
			elective_subtype: this.elective_subtype,
			units: this.units
		};
	}
}
