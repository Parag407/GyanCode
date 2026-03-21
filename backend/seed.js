/**
 * GyanCode Platform - Seed Script
 * Creates test users and 10 dummy assignments with test cases.
 * 
 * Usage: node seed.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Test Users ──────────────────────────────────────────────────────────────
const USERS = [
  {
    email: 'student123@gmail.com',
    password: 's123456',
    name: 'Test Student',
    role: 'Student',
    department: 'Computer Science',
    academic_year: '2nd Year',
  },
  {
    email: 'teacher123@gmail.com',
    password: 't123456',
    name: 'Test Teacher',
    role: 'Educator',
    department: 'Computer Science',
    academic_year: null,
  },
];

// ─── 10 Dummy Assignments ────────────────────────────────────────────────────
const ASSIGNMENTS = [
  {
    title: 'Hello World',
    description: 'Write a program that prints "Hello, World!" to the console. This is the classic first program every programmer writes.',
    language: 'Python',
    proficiency_level: 'Beginner',
    points: 10,
    category: 'Basics',
    starter_code: '# Write your solution below\n',
    expected_output: 'Hello, World!',
    test_cases: [
      { input: '', output: 'Hello, World!', is_hidden: false },
    ],
  },
  {
    title: 'Sum of Two Numbers',
    description: 'Read two integers from standard input (one per line) and print their sum.',
    language: 'Python',
    proficiency_level: 'Beginner',
    points: 10,
    category: 'Basics',
    starter_code: '# Read two numbers and print their sum\na = int(input())\nb = int(input())\n# Your code here\n',
    expected_output: '5',
    test_cases: [
      { input: '2\n3', output: '5', is_hidden: false },
      { input: '10\n20', output: '30', is_hidden: false },
      { input: '-5\n5', output: '0', is_hidden: true },
    ],
  },
  {
    title: 'Even or Odd',
    description: 'Read an integer from input and print "Even" if it is even, or "Odd" if it is odd.',
    language: 'Python',
    proficiency_level: 'Beginner',
    points: 10,
    category: 'Conditionals',
    starter_code: '# Read a number and print Even or Odd\nn = int(input())\n',
    expected_output: 'Even',
    test_cases: [
      { input: '4', output: 'Even', is_hidden: false },
      { input: '7', output: 'Odd', is_hidden: false },
      { input: '0', output: 'Even', is_hidden: true },
    ],
  },
  {
    title: 'Reverse a String',
    description: 'Read a string from input and print it reversed. For example, if the input is "hello", print "olleh".',
    language: 'JavaScript',
    proficiency_level: 'Beginner',
    points: 15,
    category: 'Strings',
    starter_code: '// Read input and print the reversed string\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  // Your code here\n  rl.close();\n});\n',
    expected_output: 'olleh',
    test_cases: [
      { input: 'hello', output: 'olleh', is_hidden: false },
      { input: 'world', output: 'dlrow', is_hidden: false },
      { input: 'abcdef', output: 'fedcba', is_hidden: true },
    ],
  },
  {
    title: 'Factorial Calculator',
    description: 'Read a non-negative integer n from input and print its factorial (n!). Recall that 0! = 1 and n! = n × (n-1) × ... × 1.',
    language: 'Python',
    proficiency_level: 'Intermediate',
    points: 20,
    category: 'Math',
    starter_code: '# Calculate factorial of n\nn = int(input())\n# Your code here\n',
    expected_output: '120',
    test_cases: [
      { input: '5', output: '120', is_hidden: false },
      { input: '0', output: '1', is_hidden: false },
      { input: '10', output: '3628800', is_hidden: true },
    ],
  },
  {
    title: 'FizzBuzz',
    description: 'Read an integer n from input. Print numbers from 1 to n, but for multiples of 3 print "Fizz", for multiples of 5 print "Buzz", and for multiples of both print "FizzBuzz". Each output on a new line.',
    language: 'Python',
    proficiency_level: 'Intermediate',
    points: 20,
    category: 'Loops',
    starter_code: '# FizzBuzz from 1 to n\nn = int(input())\n# Your code here\n',
    expected_output: '1\n2\nFizz\n4\nBuzz',
    test_cases: [
      { input: '5', output: '1\n2\nFizz\n4\nBuzz', is_hidden: false },
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', is_hidden: true },
    ],
  },
  {
    title: 'Fibonacci Sequence',
    description: 'Read an integer n from input and print the first n Fibonacci numbers separated by spaces. The sequence starts: 0 1 1 2 3 5 8 ...',
    language: 'C',
    proficiency_level: 'Intermediate',
    points: 25,
    category: 'Recursion',
    starter_code: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // Your code here\n    return 0;\n}\n',
    expected_output: '0 1 1 2 3 5 8 9',
    test_cases: [
      { input: '8', output: '0 1 1 2 3 5 8 13', is_hidden: false },
      { input: '1', output: '0', is_hidden: false },
      { input: '5', output: '0 1 1 2 3', is_hidden: true },
    ],
  },
  {
    title: 'Palindrome Check',
    description: 'Read a string from input and print "Yes" if it is a palindrome (reads the same forwards and backwards, case-insensitive), or "No" otherwise.',
    language: 'Java',
    proficiency_level: 'Intermediate',
    points: 20,
    category: 'Strings',
    starter_code: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        // Your code here\n    }\n}\n',
    expected_output: 'Yes',
    test_cases: [
      { input: 'racecar', output: 'Yes', is_hidden: false },
      { input: 'hello', output: 'No', is_hidden: false },
      { input: 'Madam', output: 'Yes', is_hidden: true },
    ],
  },
  {
    title: 'Array Maximum',
    description: 'Read n (the count) on the first line, then n space-separated integers on the second line. Print the maximum value.',
    language: 'C++',
    proficiency_level: 'Beginner',
    points: 15,
    category: 'Arrays',
    starter_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Your code here\n    return 0;\n}\n',
    expected_output: '9',
    test_cases: [
      { input: '5\n3 1 9 4 7', output: '9', is_hidden: false },
      { input: '3\n-5 -2 -8', output: '-2', is_hidden: false },
      { input: '1\n42', output: '42', is_hidden: true },
    ],
  },
  {
    title: 'Prime Number Checker',
    description: 'Read an integer n from input and print "Prime" if it is a prime number, or "Not Prime" otherwise. Assume n >= 2.',
    language: 'Python',
    proficiency_level: 'Advanced',
    points: 30,
    category: 'Math',
    starter_code: '# Check if n is prime\nn = int(input())\n# Your code here\n',
    expected_output: 'Prime',
    test_cases: [
      { input: '7', output: 'Prime', is_hidden: false },
      { input: '4', output: 'Not Prime', is_hidden: false },
      { input: '2', output: 'Prime', is_hidden: true },
      { input: '97', output: 'Prime', is_hidden: true },
      { input: '100', output: 'Not Prime', is_hidden: true },
    ],
  },
];

// ─── Main Seed Function ──────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 GyanCode Seed Script\n');

  // 1. Create users
  let teacherId = null;
  for (const user of USERS) {
    console.log(`👤 Creating user: ${user.email} (${user.role})...`);

    // Check if user already exists by email in public.users
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (existingProfile) {
      console.log(`   ✅ Already exists (id: ${existingProfile.id})`);
      if (user.role === 'Educator') teacherId = existingProfile.id;
      continue;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError) {
      // If user exists in auth but not in public.users, try to get their id
      if (authError.message.includes('already been registered')) {
        console.log(`   ⚠️ Auth user exists, checking public.users...`);
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
        const existing = authUsers?.find(u => u.email === user.email);
        if (existing) {
          // Insert profile
          const { error: profileError } = await supabase.from('users').insert([{
            id: existing.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            academic_year: user.academic_year,
          }]);
          if (profileError && !profileError.message.includes('duplicate')) {
            console.log(`   ❌ Profile insert error: ${profileError.message}`);
          } else {
            console.log(`   ✅ Profile created for existing auth user (id: ${existing.id})`);
          }
          if (user.role === 'Educator') teacherId = existing.id;
        }
        continue;
      }
      console.log(`   ❌ Auth error: ${authError.message}`);
      continue;
    }

    // Insert profile into public.users
    const { error: profileError } = await supabase.from('users').insert([{
      id: authData.user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      academic_year: user.academic_year,
    }]);

    if (profileError) {
      console.log(`   ❌ Profile error: ${profileError.message}`);
    } else {
      console.log(`   ✅ Created (id: ${authData.user.id})`);
    }

    if (user.role === 'Educator') teacherId = authData.user.id;
  }

  if (!teacherId) {
    console.error('\n❌ Could not find or create teacher user. Cannot seed assignments.');
    process.exit(1);
  }

  console.log(`\n📝 Creating 10 dummy assignments (by teacher: ${teacherId})...\n`);

  // 2. Create assignments
  for (let i = 0; i < ASSIGNMENTS.length; i++) {
    const a = ASSIGNMENTS[i];
    console.log(`  ${i + 1}. ${a.title} (${a.language}, ${a.proficiency_level}, ${a.points}pts)...`);

    // Check if assignment already exists by title + teacher
    const { data: existing } = await supabase
      .from('assignments')
      .select('id')
      .eq('title', a.title)
      .eq('created_by', teacherId)
      .single();

    if (existing) {
      console.log(`     ✅ Already exists (id: ${existing.id})`);
      continue;
    }

    const { data: assignment, error: assignError } = await supabase.from('assignments').insert([{
      title: a.title,
      description: a.description,
      language: a.language,
      proficiency_level: a.proficiency_level,
      points: a.points,
      category: a.category,
      starter_code: a.starter_code || null,
      expected_input: a.test_cases?.[0]?.input || '',
      expected_output: a.expected_output,
      is_published: true,
      created_by: teacherId,
    }]).select().single();

    if (assignError) {
      console.log(`     ❌ Error: ${assignError.message}`);
      continue;
    }

    // Insert test cases
    if (a.test_cases && a.test_cases.length > 0) {
      const tcData = a.test_cases.map(tc => ({
        assignment_id: assignment.id,
        input: tc.input,
        output: tc.output,
        is_hidden: tc.is_hidden,
      }));
      const { error: tcError } = await supabase.from('test_cases').insert(tcData);
      if (tcError) {
        console.log(`     ⚠️ Test cases error: ${tcError.message}`);
      } else {
        console.log(`     ✅ Created with ${a.test_cases.length} test case(s)`);
      }
    } else {
      console.log(`     ✅ Created (no test cases)`);
    }
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Test credentials:');
  console.log('  Student: student123@gmail.com / s123456');
  console.log('  Teacher: teacher123@gmail.com / t123456');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
