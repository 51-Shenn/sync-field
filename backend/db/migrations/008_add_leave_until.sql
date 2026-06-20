-- Add leave_until column to technicians for tracking MC/leave duration
alter table technicians add column if not exists leave_until date;
