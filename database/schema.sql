create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'teacher', 'student');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.subject_type as enum ('programming', 'file');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.assignment_type as enum ('programming', 'file');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.programming_language as enum ('cpp', 'csharp', 'python', 'javascript');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum ('pending', 'accepted', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.auto_check_status as enum ('not_required', 'passed', 'failed', 'manual_review');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.course_category as enum ('mathematics', 'english', 'russian', 'programming');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.lesson_assignment_type as enum ('image', 'voice', 'code_puzzle');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role public.user_role not null,
  name text not null,
  email text,
  login text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  department text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  student_code text not null unique,
  group_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  type public.subject_type not null,
  created_at timestamptz not null default now()
);

create table if not exists public.student_subjects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, subject_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  type public.assignment_type not null,
  deadline timestamptz not null,
  language public.programming_language,
  created_by uuid not null references public.teachers(id) on delete restrict,
  assign_to_all boolean not null default true,
  test_input text,
  expected_output text,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_students (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  code text,
  language public.programming_language,
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  status public.submission_status not null default 'pending',
  auto_check public.auto_check_status not null default 'not_required',
  comment text,
  submitted_output text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, assignment_id)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category public.course_category not null,
  cover_image text,
  total_duration_minutes integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_order integer not null,
  title text not null,
  summary text not null,
  video_url text not null,
  duration_minutes integer not null,
  assignment_type public.lesson_assignment_type not null,
  assignment_prompt text not null,
  broken_code text,
  solution_code text,
  language public.programming_language,
  created_at timestamptz not null default now()
);

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  watched_seconds integer not null default 0,
  completed_video boolean not null default false,
  completed_assignment boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create table if not exists public.lesson_submissions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  type public.lesson_assignment_type not null,
  code text,
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  status public.submission_status not null default 'pending',
  auto_check public.auto_check_status not null default 'manual_review',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create index if not exists idx_subjects_teacher on public.subjects(teacher_id);
create index if not exists idx_students_group on public.students(group_name);
create index if not exists idx_assignments_subject on public.assignments(subject_id);
create index if not exists idx_submissions_assignment on public.submissions(assignment_id);
create index if not exists idx_submissions_student on public.submissions(student_id);
create index if not exists idx_course_lessons_course on public.course_lessons(course_id);
create index if not exists idx_course_progress_student on public.course_progress(student_id);
create index if not exists idx_lesson_submissions_lesson on public.lesson_submissions(lesson_id);

alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.student_subjects enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_students enable row level security;
alter table public.submissions enable row level security;
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_progress enable row level security;
alter table public.lesson_submissions enable row level security;

drop policy if exists "users_public_access" on public.users;
create policy "users_public_access" on public.users for all using (true) with check (true);
drop policy if exists "teachers_public_access" on public.teachers;
create policy "teachers_public_access" on public.teachers for all using (true) with check (true);
drop policy if exists "students_public_access" on public.students;
create policy "students_public_access" on public.students for all using (true) with check (true);
drop policy if exists "subjects_public_access" on public.subjects;
create policy "subjects_public_access" on public.subjects for all using (true) with check (true);
drop policy if exists "student_subjects_public_access" on public.student_subjects;
create policy "student_subjects_public_access" on public.student_subjects for all using (true) with check (true);
drop policy if exists "assignments_public_access" on public.assignments;
create policy "assignments_public_access" on public.assignments for all using (true) with check (true);
drop policy if exists "assignment_students_public_access" on public.assignment_students;
create policy "assignment_students_public_access" on public.assignment_students for all using (true) with check (true);
drop policy if exists "submissions_public_access" on public.submissions;
create policy "submissions_public_access" on public.submissions for all using (true) with check (true);
drop policy if exists "courses_public_access" on public.courses;
create policy "courses_public_access" on public.courses for all using (true) with check (true);
drop policy if exists "course_lessons_public_access" on public.course_lessons;
create policy "course_lessons_public_access" on public.course_lessons for all using (true) with check (true);
drop policy if exists "course_progress_public_access" on public.course_progress;
create policy "course_progress_public_access" on public.course_progress for all using (true) with check (true);
drop policy if exists "lesson_submissions_public_access" on public.lesson_submissions;
create policy "lesson_submissions_public_access" on public.lesson_submissions for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('submission-files', 'submission-files', true)
on conflict (id) do nothing;

drop policy if exists "submission_files_public_read" on storage.objects;
create policy "submission_files_public_read"
on storage.objects for select
using (bucket_id = 'submission-files');

drop policy if exists "submission_files_public_insert" on storage.objects;
create policy "submission_files_public_insert"
on storage.objects for insert
with check (bucket_id = 'submission-files');

drop policy if exists "submission_files_public_update" on storage.objects;
create policy "submission_files_public_update"
on storage.objects for update
using (bucket_id = 'submission-files')
with check (bucket_id = 'submission-files');

drop policy if exists "submission_files_public_delete" on storage.objects;
create policy "submission_files_public_delete"
on storage.objects for delete
using (bucket_id = 'submission-files');
