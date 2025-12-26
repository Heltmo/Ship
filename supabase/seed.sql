-- Seed common skills for TeamMatch
-- Run this after applying the initial schema migration

INSERT INTO public.skills (name, category) VALUES
  -- Programming Languages
  ('JavaScript', 'programming'),
  ('TypeScript', 'programming'),
  ('Python', 'programming'),
  ('Java', 'programming'),
  ('Go', 'programming'),
  ('Rust', 'programming'),
  ('Ruby', 'programming'),
  ('PHP', 'programming'),
  ('C++', 'programming'),
  ('C#', 'programming'),
  ('Swift', 'programming'),
  ('Kotlin', 'programming'),

  -- Frontend
  ('React', 'frontend'),
  ('Vue.js', 'frontend'),
  ('Angular', 'frontend'),
  ('Next.js', 'frontend'),
  ('Svelte', 'frontend'),
  ('HTML', 'frontend'),
  ('CSS', 'frontend'),
  ('Tailwind CSS', 'frontend'),
  ('SASS', 'frontend'),
  ('Webpack', 'frontend'),

  -- Backend
  ('Node.js', 'backend'),
  ('Express', 'backend'),
  ('Django', 'backend'),
  ('Flask', 'backend'),
  ('FastAPI', 'backend'),
  ('Ruby on Rails', 'backend'),
  ('Spring Boot', 'backend'),
  ('Laravel', 'backend'),
  ('.NET', 'backend'),

  -- Mobile
  ('React Native', 'mobile'),
  ('Flutter', 'mobile'),
  ('iOS Development', 'mobile'),
  ('Android Development', 'mobile'),
  ('SwiftUI', 'mobile'),

  -- Databases
  ('PostgreSQL', 'database'),
  ('MySQL', 'database'),
  ('MongoDB', 'database'),
  ('Redis', 'database'),
  ('Supabase', 'database'),
  ('Firebase', 'database'),
  ('DynamoDB', 'database'),
  ('SQLite', 'database'),

  -- DevOps & Infrastructure
  ('Docker', 'devops'),
  ('Kubernetes', 'devops'),
  ('AWS', 'devops'),
  ('Google Cloud', 'devops'),
  ('Azure', 'devops'),
  ('CI/CD', 'devops'),
  ('Terraform', 'devops'),
  ('GitHub Actions', 'devops'),

  -- Design
  ('Figma', 'design'),
  ('Adobe XD', 'design'),
  ('Sketch', 'design'),
  ('Photoshop', 'design'),
  ('Illustrator', 'design'),
  ('UI/UX Design', 'design'),
  ('Graphic Design', 'design'),
  ('Product Design', 'design'),
  ('Prototyping', 'design'),

  -- Data & AI
  ('Machine Learning', 'data'),
  ('Data Science', 'data'),
  ('TensorFlow', 'data'),
  ('PyTorch', 'data'),
  ('Pandas', 'data'),
  ('Data Analysis', 'data'),
  ('SQL', 'data'),

  -- Marketing & Growth
  ('SEO', 'marketing'),
  ('Content Marketing', 'marketing'),
  ('Social Media Marketing', 'marketing'),
  ('Email Marketing', 'marketing'),
  ('Google Analytics', 'marketing'),
  ('Growth Hacking', 'marketing'),
  ('Copywriting', 'marketing'),

  -- Business & Product
  ('Product Management', 'product'),
  ('Project Management', 'product'),
  ('Agile', 'product'),
  ('Scrum', 'product'),
  ('Business Strategy', 'product'),
  ('User Research', 'product'),
  ('A/B Testing', 'product'),

  -- Other
  ('Git', 'tools'),
  ('API Development', 'backend'),
  ('REST API', 'backend'),
  ('GraphQL', 'backend'),
  ('WebSockets', 'backend'),
  ('Blockchain', 'other'),
  ('Web3', 'other')

ON CONFLICT (name) DO NOTHING;
