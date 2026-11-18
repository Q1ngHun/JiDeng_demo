-- 家灯 JiaDeng · SQLite 数据库结构
-- 由 backend/tools/dump_schema.py 从 SQLAlchemy 模型导出
-- 直接启动后端时也会自动建表，无需手动执行本文件

CREATE TABLE users (
	id INTEGER NOT NULL, 
	username VARCHAR(32) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	nickname VARCHAR(32) NOT NULL, 
	real_name VARCHAR(32) NOT NULL, 
	avatar_text VARCHAR(4) NOT NULL, 
	avatar_color VARCHAR(16) NOT NULL, 
	phone VARCHAR(20), 
	openid VARCHAR(64), 
	unionid VARCHAR(64), 
	push_clientid VARCHAR(64), 
	role VARCHAR(16) NOT NULL, 
	is_demo BOOLEAN, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX ix_users_username ON users (username);

CREATE TABLE families (
	id INTEGER NOT NULL, 
	name VARCHAR(64) NOT NULL, 
	owner_id INTEGER NOT NULL, 
	invite_code VARCHAR(16) NOT NULL, 
	"plan" VARCHAR(16) NOT NULL, 
	member_limit INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	UNIQUE (invite_code)
);

CREATE TABLE notification_settings (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	push BOOLEAN, 
	wechat BOOLEAN, 
	sms BOOLEAN, 
	notify_done BOOLEAN, 
	notify_overdue BOOLEAN, 
	notify_weekly BOOLEAN, 
	quiet_enabled BOOLEAN, 
	quiet_start VARCHAR(8), 
	quiet_end VARCHAR(8), 
	urgent_pass BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE user_settings (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	care_mode VARCHAR(16), 
	font_scale FLOAT, 
	last_sync_at DATETIME, 
	offline_cached_tasks INTEGER, 
	biometric_enabled BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE widget_settings (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	size VARCHAR(8), 
	show_tasks BOOLEAN, 
	show_claim_count BOOLEAN, 
	show_next_checkup BOOLEAN, 
	show_health BOOLEAN, 
	live_activity BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE elders (
	id INTEGER NOT NULL, 
	family_id INTEGER NOT NULL, 
	user_id INTEGER, 
	name VARCHAR(32) NOT NULL, 
	relation VARCHAR(16), 
	gender VARCHAR(4), 
	birthday VARCHAR(16), 
	height VARCHAR(16), 
	weight VARCHAR(16), 
	blood_type VARCHAR(8), 
	conditions VARCHAR(255), 
	allergies VARCHAR(255), 
	hospital VARCHAR(64), 
	doctor VARCHAR(32), 
	next_checkup_at DATE, 
	completeness INTEGER, 
	avatar_color VARCHAR(16), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(family_id) REFERENCES families (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE INDEX ix_elders_family_id ON elders (family_id);

CREATE TABLE export_records (
	id INTEGER NOT NULL, 
	family_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	scope VARCHAR(32), 
	options JSON, 
	event_count INTEGER, 
	file_name VARCHAR(128), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(family_id) REFERENCES families (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE INDEX ix_export_records_created_at ON export_records (created_at);
CREATE INDEX ix_export_records_family_id ON export_records (family_id);

CREATE TABLE family_members (
	id INTEGER NOT NULL, 
	family_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	relation VARCHAR(24) NOT NULL, 
	role VARCHAR(16) NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	can_view_meds BOOLEAN, 
	can_view_history BOOLEAN, 
	can_view_reports BOOLEAN, 
	joined_at DATETIME, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_family_user UNIQUE (family_id, user_id), 
	FOREIGN KEY(family_id) REFERENCES families (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE INDEX ix_family_members_family_id ON family_members (family_id);
CREATE INDEX ix_family_members_user_id ON family_members (user_id);

CREATE TABLE memberships (
	id INTEGER NOT NULL, 
	family_id INTEGER NOT NULL, 
	"plan" VARCHAR(16), 
	price_cents INTEGER, 
	started_at DATETIME, 
	expires_at DATETIME, 
	auto_renew BOOLEAN, 
	refundable_until DATETIME, 
	status VARCHAR(16), 
	PRIMARY KEY (id), 
	FOREIGN KEY(family_id) REFERENCES families (id)
);
CREATE INDEX ix_memberships_family_id ON memberships (family_id);

CREATE TABLE pay_orders (
	id INTEGER NOT NULL, 
	out_trade_no VARCHAR(48) NOT NULL, 
	family_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	"plan" VARCHAR(16), 
	amount_cents INTEGER, 
	channel VARCHAR(16), 
	status VARCHAR(16), 
	transaction_id VARCHAR(64), 
	created_at DATETIME, 
	paid_at DATETIME, 
	refunded_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (out_trade_no), 
	FOREIGN KEY(family_id) REFERENCES families (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE schedule_slots (
	id INTEGER NOT NULL, 
	family_id INTEGER NOT NULL, 
	member_id INTEGER NOT NULL, 
	day DATE NOT NULL, 
	has_duty BOOLEAN, 
	label VARCHAR(64), 
	PRIMARY KEY (id), 
	CONSTRAINT uq_slot UNIQUE (family_id, member_id, day), 
	FOREIGN KEY(family_id) REFERENCES families (id), 
	FOREIGN KEY(member_id) REFERENCES users (id)
);
CREATE INDEX ix_schedule_slots_day ON schedule_slots (day);
CREATE INDEX ix_schedule_slots_family_id ON schedule_slots (family_id);

CREATE TABLE access_logs (
	id INTEGER NOT NULL, 
	elder_id INTEGER NOT NULL, 
	viewer_id INTEGER, 
	viewer_name VARCHAR(32), 
	viewer_tag VARCHAR(16), 
	scope VARCHAR(64), 
	action VARCHAR(16), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(elder_id) REFERENCES elders (id), 
	FOREIGN KEY(viewer_id) REFERENCES users (id)
);
CREATE INDEX ix_access_logs_elder_id ON access_logs (elder_id);
CREATE INDEX ix_access_logs_created_at ON access_logs (created_at);

CREATE TABLE follow_ups (
	id INTEGER NOT NULL, 
	elder_id INTEGER NOT NULL, 
	title VARCHAR(64), 
	cycle_days INTEGER, 
	last_date DATE, 
	next_date DATE, 
	need_confirm BOOLEAN, 
	is_active BOOLEAN, 
	PRIMARY KEY (id), 
	FOREIGN KEY(elder_id) REFERENCES elders (id)
);
CREATE INDEX ix_follow_ups_elder_id ON follow_ups (elder_id);

CREATE TABLE medications (
	id INTEGER NOT NULL, 
	elder_id INTEGER NOT NULL, 
	name VARCHAR(64) NOT NULL, 
	dosage VARCHAR(64), 
	frequency VARCHAR(64), 
	timing VARCHAR(32), 
	start_date DATE, 
	end_date DATE, 
	total_days INTEGER, 
	remaining_days INTEGER, 
	remaining_qty INTEGER, 
	status VARCHAR(16), 
	note VARCHAR(120), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(elder_id) REFERENCES elders (id)
);
CREATE INDEX ix_medications_elder_id ON medications (elder_id);

CREATE TABLE reports (
	id INTEGER NOT NULL, 
	elder_id INTEGER NOT NULL, 
	title VARCHAR(64) NOT NULL, 
	taken_at DATE, 
	image_url VARCHAR(255), 
	abnormal_count INTEGER, 
	confidence INTEGER, 
	indicators JSON, 
	summary_abnormal TEXT, 
	summary_meaning TEXT, 
	summary_advice TEXT, 
	questions JSON, 
	status VARCHAR(16), 
	disclaimer TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(elder_id) REFERENCES elders (id)
);
CREATE INDEX ix_reports_elder_id ON reports (elder_id);

CREATE TABLE tasks (
	id INTEGER NOT NULL, 
	family_id INTEGER NOT NULL, 
	elder_id INTEGER, 
	title VARCHAR(120) NOT NULL, 
	category VARCHAR(16), 
	description TEXT, 
	creator_id INTEGER NOT NULL, 
	assignee_id INTEGER, 
	scheduled_at DATETIME NOT NULL, 
	due_at DATETIME, 
	is_urgent BOOLEAN, 
	repeat_rule VARCHAR(16), 
	repeat_until DATE, 
	location VARCHAR(120), 
	remind_label VARCHAR(64), 
	need_confirm BOOLEAN, 
	status VARCHAR(24), 
	source VARCHAR(16), 
	claimed_at DATETIME, 
	started_at DATETIME, 
	completed_at DATETIME, 
	confirmed_at DATETIME, 
	timeout_at DATETIME, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(family_id) REFERENCES families (id), 
	FOREIGN KEY(elder_id) REFERENCES elders (id), 
	FOREIGN KEY(creator_id) REFERENCES users (id), 
	FOREIGN KEY(assignee_id) REFERENCES users (id)
);
CREATE INDEX ix_tasks_status ON tasks (status);
CREATE INDEX ix_tasks_family_id ON tasks (family_id);
CREATE INDEX ix_tasks_created_at ON tasks (created_at);
CREATE INDEX ix_tasks_scheduled_at ON tasks (scheduled_at);
CREATE INDEX ix_tasks_elder_id ON tasks (elder_id);

CREATE TABLE attachments (
	id INTEGER NOT NULL, 
	task_id INTEGER NOT NULL, 
	kind VARCHAR(16), 
	url VARCHAR(255) NOT NULL, 
	duration INTEGER, 
	uploaded_by INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(task_id) REFERENCES tasks (id), 
	FOREIGN KEY(uploaded_by) REFERENCES users (id)
);
CREATE INDEX ix_attachments_task_id ON attachments (task_id);

CREATE TABLE notification_logs (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	task_id INTEGER, 
	channel VARCHAR(16), 
	title VARCHAR(120), 
	body VARCHAR(255), 
	status VARCHAR(24), 
	degrade_reason VARCHAR(120), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(task_id) REFERENCES tasks (id)
);
CREATE INDEX ix_notification_logs_created_at ON notification_logs (created_at);
CREATE INDEX ix_notification_logs_user_id ON notification_logs (user_id);

CREATE TABLE task_events (
	id INTEGER NOT NULL, 
	family_id INTEGER NOT NULL, 
	task_id INTEGER, 
	actor_id INTEGER, 
	actor_name VARCHAR(32), 
	action VARCHAR(32) NOT NULL, 
	from_status VARCHAR(24), 
	to_status VARCHAR(24), 
	note VARCHAR(255), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(family_id) REFERENCES families (id), 
	FOREIGN KEY(task_id) REFERENCES tasks (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
);
CREATE INDEX ix_task_events_task_id ON task_events (task_id);
CREATE INDEX ix_task_events_family_id ON task_events (family_id);
CREATE INDEX ix_task_events_created_at ON task_events (created_at);
