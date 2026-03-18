truncate table
  public.assignment_students,
  public.student_subjects,
  public.submissions,
  public.assignments,
  public.subjects,
  public.students,
  public.teachers,
  public.users
restart identity cascade;

insert into public.users (role, name, email, login, password_hash)
values ('admin', 'System Admin', 'admin@amaliy.local', 'admin', 'admin123');
