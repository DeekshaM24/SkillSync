import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_DEMO_PASSWORD;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
if (!password || password.length < 12) throw new Error("Set SEED_DEMO_PASSWORD to a temporary password of at least 12 characters before seeding.");

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const institutionName = "Northstar Institute of Technology";

const verbal = [
  ["abundant", "plentiful", "scarce", "brief", "uncertain"], ["accurate", "precise", "careless", "distant", "rapid"],
  ["adapt", "adjust", "refuse", "forget", "divide"], ["adverse", "unfavorable", "helpful", "ordinary", "pleasant"],
  ["ambiguous", "unclear", "obvious", "reliable", "simple"], ["amiable", "friendly", "hostile", "formal", "quiet"],
  ["brief", "concise", "lengthy", "complex", "distant"], ["candid", "frank", "secretive", "careful", "polite"],
  ["cautious", "prudent", "reckless", "curious", "confident"], ["coherent", "logical", "random", "fragile", "minor"],
  ["compile", "assemble", "scatter", "ignore", "delay"], ["concise", "succinct", "wordy", "unclear", "formal"],
  ["confident", "assured", "doubtful", "careless", "anxious"], ["consistent", "steady", "erratic", "temporary", "rare"],
  ["crucial", "essential", "optional", "ordinary", "distant"], ["diligent", "hardworking", "idle", "uncertain", "casual"],
  ["diminish", "reduce", "increase", "combine", "maintain"], ["efficient", "productive", "wasteful", "unclear", "cautious"],
  ["evident", "apparent", "hidden", "rare", "formal"], ["expand", "enlarge", "restrict", "remove", "compare"],
  ["feasible", "practical", "impossible", "unclear", "temporary"], ["genuine", "authentic", "artificial", "fragile", "ordinary"],
  ["inevitable", "unavoidable", "unlikely", "optional", "uncertain"], ["innovative", "original", "outdated", "careless", "minor"],
  ["maintain", "preserve", "abandon", "divide", "reduce"],
];
const technical: [string, string, string[]][] = [
  ["Which data structure follows the LIFO principle?", "Stack", ["Queue", "Tree", "Graph"]],
  ["Which data structure follows the FIFO principle?", "Queue", ["Stack", "Heap", "Tree"]],
  ["What is the average lookup complexity of a hash table?", "O(1)", ["O(log n)", "O(n)", "O(n log n)"]],
  ["Which traversal of a binary search tree returns sorted keys?", "In-order", ["Pre-order", "Post-order", "Level-order"]],
  ["Which HTTP method is conventionally used to retrieve a resource?", "GET", ["POST", "PATCH", "DELETE"]],
  ["Which SQL clause filters grouped aggregate results?", "HAVING", ["WHERE", "ORDER BY", "LIMIT"]],
  ["What does DNS primarily translate?", "Domain names to IP addresses", ["HTML to CSS", "Ports to protocols", "Files to packets"]],
  ["Which protocol provides reliable, ordered byte delivery?", "TCP", ["UDP", "DNS", "ICMP"]],
  ["Which normal form removes partial dependency on a composite key?", "Second normal form", ["First normal form", "Third normal form", "Boyce-Codd normal form"]],
  ["Which memory area stores function call frames?", "Call stack", ["Heap", "Cache", "Disk"]],
  ["Which Git command creates a new branch and switches to it?", "git switch -c", ["git merge", "git fetch", "git status"]],
  ["What is the result of a successful HTTP status in the 200 range?", "The request succeeded", ["The request was redirected", "The client made an error", "The server failed"]],
  ["Which structure is commonly used for breadth-first search?", "Queue", ["Stack", "Hash set", "Priority-free tree"]],
  ["Which sorting algorithm guarantees O(n log n) worst-case time?", "Merge sort", ["Insertion sort", "Bubble sort", "Selection sort"]],
  ["Which OS component decides which process runs next?", "Scheduler", ["Linker", "Assembler", "Loader"]],
  ["What does an index help a database do?", "Find rows faster", ["Encrypt every row", "Remove duplicate columns", "Back up transactions"]],
  ["Which access modifier allows access only within the declaring class?", "Private", ["Public", "Protected", "Package-wide"]],
  ["Which JavaScript value represents an intentionally absent object property?", "undefined", ["false", "NaN", "Infinity"]],
  ["Which CSS layout is designed for one-dimensional arrangements?", "Flexbox", ["Grid", "Float", "Positioning"]],
  ["What is the primary role of an API?", "Define how software components communicate", ["Compress source files", "Store passwords", "Schedule CPU tasks"]],
  ["Which data structure efficiently supports priority-based removal?", "Heap", ["Queue", "Linked list", "Stack"]],
  ["What does ACID consistency require of a database transaction?", "It preserves defined data rules", ["It always runs in parallel", "It cannot be rolled back", "It skips validation"]],
  ["Which mechanism lets a process wait for an asynchronous result?", "Promise", ["Array", "CSS selector", "Binary tree"]],
  ["Which network layer is responsible for routing IP packets?", "Network layer", ["Application layer", "Presentation layer", "Physical layer"]],
  ["Which design principle gives a class one focused reason to change?", "Single responsibility", ["Open addressing", "Event bubbling", "Round robin"]],
];

const problemSeeds: { title: string; difficulty: "easy" | "medium" | "hard"; statement: string; tags: string[] }[] = [
  { title: "Pair Sum", difficulty: "easy", statement: "Given an integer array and a target, return the indices of two distinct values whose sum equals the target.", tags: ["arrays", "hash-map"] },
  { title: "Reverse a String", difficulty: "easy", statement: "Return the input string with its characters in reverse order.", tags: ["strings"] },
  { title: "Valid Parentheses", difficulty: "easy", statement: "Determine whether every opening bracket in the input is closed in the correct order.", tags: ["stack", "strings"] },
  { title: "Merge Sorted Arrays", difficulty: "easy", statement: "Merge two non-decreasing integer arrays into one non-decreasing array.", tags: ["arrays", "two-pointers"] },
  { title: "First Unique Character", difficulty: "easy", statement: "Return the index of the first character that occurs exactly once, or -1 when no such character exists.", tags: ["strings", "hash-map"] },
  { title: "Binary Search", difficulty: "medium", statement: "Return the index of target in a sorted array, or -1 when it is absent.", tags: ["arrays", "binary-search"] },
  { title: "Maximum Subarray", difficulty: "medium", statement: "Find the maximum sum of a non-empty contiguous subarray.", tags: ["arrays", "dynamic-programming"] },
  { title: "Longest Common Prefix", difficulty: "medium", statement: "Return the longest prefix shared by all strings in the input.", tags: ["strings"] },
  { title: "BFS Shortest Path", difficulty: "medium", statement: "Given an unweighted graph, find the minimum number of edges from a source node to a target node.", tags: ["graphs", "bfs"] },
  { title: "Coin Change", difficulty: "hard", statement: "Find the minimum number of coins needed to form an amount, or -1 if the amount cannot be formed.", tags: ["dynamic-programming"] },
];

const problemCases: Record<string, [string, string, string, string]> = {
  "pair-sum": ["4\n2 7 11 15\n9", "0 1", "3\n3 2 4\n6", "1 2"],
  "reverse-a-string": ["hello", "olleh", "placement", "tnemecalp"],
  "valid-parentheses": ["()[]{}", "true", "(]", "false"],
  "merge-sorted-arrays": ["3\n1 3 5\n3\n2 4 6", "1 2 3 4 5 6", "2\n1 4\n3\n2 3 5", "1 2 3 4 5"],
  "first-unique-character": ["leetcode", "0", "aabb", "-1"],
  "binary-search": ["6\n1 2 3 4 5 6\n4", "3", "5\n1 3 5 7 9\n2", "-1"],
  "maximum-subarray": ["9\n-2 1 -3 4 -1 2 1 -5 4", "6", "1\n-4", "-4"],
  "longest-common-prefix": ["3\nflower flow flight", "fl", "3\ndog racecar car", ""],
  "bfs-shortest-path": ["5 5\n0 1\n0 2\n1 3\n2 3\n3 4\n0 4", "3", "4 2\n0 1\n2 3\n0 3", "-1"],
  "coin-change": ["3 11\n1 2 5", "3", "1 3\n2", "-1"],
};

function questionRows(institutionId: string) {
  const rows = [];
  for (let index = 0; index < 100; index += 1) {
    const category = Math.floor(index / 25);
    const offset = index % 25;
    let topic: string;
    let prompt: string;
    let answer: string;
    let options: string[];
    if (category === 0) {
      topic = "Quantitative Aptitude · Percentages";
      const percent = 10 + (offset % 9) * 5;
      const amount = (offset + 11) * 20;
      const exact = amount * percent / 100;
      prompt = `What is ${percent}% of ${amount}?`;
      answer = String(exact);
      options = [String(exact + 5), String(exact), String(Math.max(0, exact - 5)), String(exact + 10)];
    } else if (category === 1) {
      topic = "Verbal Ability · Vocabulary";
      const [word, synonym, ...distractors] = verbal[offset];
      prompt = `Choose the closest meaning of “${word}”.`;
      answer = synonym;
      options = [distractors[0], synonym, distractors[1], distractors[2]];
    } else if (category === 2) {
      topic = "Logical Reasoning · Number Series";
      const start = 3 + offset * 2;
      const step = 2 + (offset % 7);
      const sequence = [0, 1, 2, 3].map((item) => start + item * step);
      const next = start + 4 * step;
      prompt = `Find the next number in the sequence: ${sequence.join(", ")}, ?`;
      answer = String(next);
      options = [String(next + 1), String(next - step), String(next), String(next + step)];
    } else {
      topic = "Technical Fundamentals · Computer Science";
      const [question, correct, distractors] = technical[offset];
      prompt = question;
      answer = correct;
      options = [distractors[0], correct, distractors[1], distractors[2]];
    }
    rows.push({
      institution_id: institutionId,
      topic,
      difficulty: offset % 3 === 0 ? "easy" : offset % 3 === 1 ? "medium" : "hard",
      type: "mcq" as const,
      prompt,
      options,
      answer,
      explanation: `The correct answer is ${answer}. Review the underlying ${topic.split(" · ")[1].toLowerCase()} concept and try a similar practice question.`,
    });
  }
  return rows;
}

async function main() {
  const { data: institution, error: institutionError } = await supabase.from("institutions").upsert(
    { name: institutionName, code: "NORTHSTAR-DEMO", city: "Pune" },
    { onConflict: "name" },
  ).select("id").single();
  if (institutionError) throw new Error(`Unable to seed institution: ${institutionError.message}`);

  const batchInputs = [
    { institution_id: institution.id, name: "Computer Science · Class of 2027", code: "NS-CSE-27", department: "Computer Science" },
    { institution_id: institution.id, name: "Electronics · Class of 2027", code: "NS-ECE-27", department: "Electronics" },
  ];
  const { data: batches, error: batchError } = await supabase.from("batches").upsert(batchInputs, { onConflict: "code" }).select("id,code");
  if (batchError) throw new Error(`Unable to seed batches: ${batchError.message}`);
  const batchByCode = new Map((batches ?? []).map((batch) => [batch.code, batch.id]));

  const users = [
    { email: "admin@skillsync.demo", name: "Ananya Sharma", role: "admin" as const, department: null, batch: null },
    { email: "trainer@skillsync.demo", name: "Rohan Mehta", role: "trainer" as const, department: "Career Development", batch: null },
    ...Array.from({ length: 10 }, (_, index) => ({
      email: `student${String(index + 1).padStart(2, "0")}@skillsync.demo`,
      name: ["Aarav Kapoor", "Isha Nair", "Kabir Joshi", "Meera Iyer", "Dev Patel", "Anaya Rao", "Vihaan Das", "Sara Khan", "Arjun Menon", "Diya Shah"][index],
      role: "student" as const,
      department: index < 5 ? "Computer Science" : "Electronics",
      batch: index < 5 ? "NS-CSE-27" : "NS-ECE-27",
    })),
  ];
  const { data: authUsersPage, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw new Error(`Unable to list demo users: ${usersError.message}`);
  const authByEmail = new Map((authUsersPage.users ?? []).map((user) => [user.email?.toLowerCase(), user.id]));
  const seededProfiles: { id: string; role: "student" | "trainer" | "admin"; name: string; email: string; batch: string | null; department: string | null; index: number }[] = [];
  for (const entry of users) {
    let userId = authByEmail.get(entry.email);
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({ email: entry.email, password, email_confirm: true, user_metadata: { full_name: entry.name } });
      if (error) throw new Error(`Unable to create demo user ${entry.email}: ${error.message}`);
      userId = data.user.id;
    }
    const studentIndex = entry.role === "student" ? Number(entry.email.match(/student(\d+)/)?.[1] ?? 1) : 0;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      role: entry.role,
      full_name: entry.name,
      email: entry.email,
      institution_id: institution.id,
      department: entry.department,
      year_of_study: entry.role === "student" ? 4 : null,
      roll_number: entry.role === "student" ? `NS${entry.department === "Computer Science" ? "CSE" : "ECE"}27${String(studentIndex).padStart(3, "0")}` : null,
      target_role: entry.role === "student" ? "Software Engineer" : null,
      designation: entry.role === "admin" ? "Placement Officer" : null,
      subjects_taught: entry.role === "trainer" ? ["Aptitude", "Technical Interviews", "Career Readiness"] : null,
    }, { onConflict: "id" });
    if (profileError) throw new Error(`Unable to seed profile ${entry.email}: ${profileError.message}`);
    seededProfiles.push({ id: userId, role: entry.role, name: entry.name, email: entry.email, batch: entry.batch, department: entry.department, index: studentIndex });
  }

  const trainer = seededProfiles.find((user) => user.role === "trainer");
  const admin = seededProfiles.find((user) => user.role === "admin");
  if (!trainer || !admin) throw new Error("The demo trainer and administrator could not be created.");
  const { error: trainerAssignmentError } = await supabase.from("batch_trainers").upsert(
    (batches ?? []).map((batch) => ({ batch_id: batch.id, trainer_id: trainer.id })),
    { onConflict: "batch_id,trainer_id" },
  );
  if (trainerAssignmentError) throw new Error(`Unable to assign demo trainer: ${trainerAssignmentError.message}`);
  for (const student of seededProfiles.filter((user) => user.role === "student")) {
    const batchId = student.batch ? batchByCode.get(student.batch) : null;
    if (!batchId) throw new Error(`The demo batch for ${student.email} was not created.`);
    const { error } = await supabase.from("batch_members").upsert({ batch_id: batchId, student_id: student.id }, { onConflict: "batch_id,student_id" });
    if (error) throw new Error(`Unable to add ${student.email} to their batch: ${error.message}`);
  }

  const generatedQuestions = questionRows(institution.id);
  const { data: existingQuestions, error: existingQuestionError } = await supabase.from("questions").select("id,prompt").eq("institution_id", institution.id);
  if (existingQuestionError) throw new Error(`Unable to check existing questions: ${existingQuestionError.message}`);
  const existingPrompt = new Set((existingQuestions ?? []).map((question) => question.prompt));
  const toInsert = generatedQuestions.filter((question) => !existingPrompt.has(question.prompt));
  if (toInsert.length) {
    const { error } = await supabase.from("questions").insert(toInsert);
    if (error) throw new Error(`Unable to seed MCQs: ${error.message}`);
  }
  const { data: allQuestions, error: allQuestionsError } = await supabase.from("questions").select("id,prompt,answer,options").eq("institution_id", institution.id).order("created_at").limit(100);
  if (allQuestionsError) throw new Error(`Unable to load seeded questions: ${allQuestionsError.message}`);
  if ((allQuestions ?? []).length < 100) throw new Error("The question seed did not produce all 100 MCQs.");

  const codingRows = problemSeeds.map(({ title, difficulty, statement, tags }, index) => ({
    institution_id: institution.id,
    title,
    slug: title.toLowerCase().replaceAll(" ", "-"),
    difficulty,
    statement: `${statement}\n\nInput: ${index === 0 ? "An integer array and a target integer." : "One or more values described in the prompt."}\nOutput: Return the requested result using the function signature provided.\n\nConstraints: Prefer an efficient solution and explain its time complexity.`,
    tags: [...tags],
    company_tags: index < 4 ? ["Northstar Labs", "Acme Systems"] : ["Northstar Labs"],
    starter_code: { javascript: "function solve(input) {\n  // Implement your solution\n}\n", python: "def solve(input):\n    # Implement your solution\n    pass\n" },
  }));
  const { error: codingError } = await supabase.from("coding_problems").upsert(codingRows, { onConflict: "slug" });
  if (codingError) throw new Error(`Unable to seed coding problems: ${codingError.message}`);
  const { data: codingProblems, error: problemsError } = await supabase.from("coding_problems").select("id,slug").in("slug", codingRows.map((problem) => problem.slug));
  if (problemsError) throw new Error(`Unable to load coding problems: ${problemsError.message}`);
  for (const problem of codingProblems ?? []) {
    const { count, error: countError } = await supabase.from("test_cases").select("id", { count: "exact", head: true }).eq("problem_id", problem.id);
    if (countError) throw new Error(`Unable to check test cases for ${problem.slug}: ${countError.message}`);
    if (count) continue;
    const [input, expected, hiddenInput, hiddenExpected] = problemCases[problem.slug];
    const cases = [
      { problem_id: problem.id, input, expected_output: expected, is_hidden: false },
      { problem_id: problem.id, input: hiddenInput, expected_output: hiddenExpected, is_hidden: true },
    ];
    const { error } = await supabase.from("test_cases").insert(cases);
    if (error) throw new Error(`Unable to seed test cases for ${problem.slug}: ${error.message}`);
  }

  const testTitle = "Placement Foundations · Practice Check";
  const { data: existingTest, error: testLookupError } = await supabase.from("tests").select("id").eq("created_by", trainer.id).eq("title", testTitle).maybeSingle();
  if (testLookupError) throw new Error(`Unable to check the demo test: ${testLookupError.message}`);
  let testId = existingTest?.id;
  if (!testId) {
    const { data, error } = await supabase.from("tests").insert({ institution_id: institution.id, created_by: trainer.id, title: testTitle, description: "A seeded 10-question practice assessment across core placement topics.", duration_minutes: 20, published: true }).select("id").single();
    if (error) throw new Error(`Unable to create demo test: ${error.message}`);
    testId = data.id;
  } else {
    const { error } = await supabase.from("tests").update({ published: true }).eq("id", testId);
    if (error) throw new Error(`Unable to publish demo test: ${error.message}`);
  }
  const selectedQuestions = (allQuestions ?? []).slice(0, 10);
  const { error: testQuestionError } = await supabase.from("test_questions").upsert(
    selectedQuestions.map((question, position) => ({ test_id: testId, question_id: question.id, position, points: 1 })),
    { onConflict: "test_id,question_id" },
  );
  if (testQuestionError) throw new Error(`Unable to add questions to the demo test: ${testQuestionError.message}`);
  const assignments = (batches ?? []).map((batch) => ({
    test_id: testId,
    batch_id: batch.id,
    assigned_by: trainer.id,
    due_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  }));
  const { error: assignmentError } = await supabase.from("test_assignments").upsert(assignments, { onConflict: "test_id,batch_id" });
  if (assignmentError) throw new Error(`Unable to assign the demo test: ${assignmentError.message}`);

  for (const student of seededProfiles.filter((user) => user.role === "student")) {
    const correctCount = 5 + (student.index % 6);
    const startedAt = new Date(Date.UTC(2026, 8, 29 + student.index, 10)).toISOString();
    const submittedAt = new Date(Date.UTC(2026, 8, 29 + student.index, 10, 20)).toISOString();
    const { data: attempt, error } = await supabase.from("test_attempts").upsert({
      test_id: testId,
      student_id: student.id,
      started_at: startedAt,
      submitted_at: submittedAt,
      score: correctCount,
      max_score: 10,
      status: "submitted",
    }, { onConflict: "test_id,student_id,started_at" }).select("id").single();
    if (error) throw new Error(`Unable to seed an assessment for ${student.email}: ${error.message}`);
    const answers = selectedQuestions.map((question, questionIndex) => {
      const isCorrect = questionIndex < correctCount;
      const answer = isCorrect ? question.answer : (question.options as string[]).find((option) => option !== question.answer) ?? "";
      return { attempt_id: attempt.id, question_id: question.id, answer, is_correct: isCorrect, time_spent: 35 + questionIndex * 7 };
    });
    const { error: answersError } = await supabase.from("attempt_answers").upsert(answers, { onConflict: "attempt_id,question_id" });
    if (answersError) throw new Error(`Unable to seed test answers for ${student.email}: ${answersError.message}`);
    const { error: pointsError } = await supabase.from("points_ledger").upsert({
      student_id: student.id,
      points: 20 + correctCount * 5,
      reason: "Demo practice assessment completion",
      source_key: `demo-attempt-points-${student.id}`,
      created_at: submittedAt,
    }, { onConflict: "source_key" });
    if (pointsError) throw new Error(`Unable to seed points for ${student.email}: ${pointsError.message}`);
    const currentStreak = 1 + student.index % 6;
    const { error: streakError } = await supabase.from("streaks").upsert({
      student_id: student.id,
      current_streak: currentStreak,
      longest_streak: Math.max(currentStreak, 3 + student.index % 8),
      last_activity_date: new Date().toISOString().slice(0, 10),
    }, { onConflict: "student_id" });
    if (streakError) throw new Error(`Unable to seed activity streak for ${student.email}: ${streakError.message}`);
  }

  const { data: badge, error: badgeError } = await supabase.from("badges").upsert({
    name: "First Steps",
    description: "Completed your first practice assessment.",
    icon: "sparkles",
  }, { onConflict: "name" }).select("id").single();
  if (badgeError) throw new Error(`Unable to seed demo badge: ${badgeError.message}`);
  const badgeAssignments = seededProfiles.filter((user) => user.role === "student").slice(0, 3).map((student) => ({ student_id: student.id, badge_id: badge.id }));
  const { error: userBadgeError } = await supabase.from("user_badges").upsert(badgeAssignments, { onConflict: "student_id,badge_id" });
  if (userBadgeError) throw new Error(`Unable to award the demo badge: ${userBadgeError.message}`);

  console.info(`Seed complete for ${institutionName} (${institution.id}).`);
  console.info(`Demo accounts (all use the SEED_DEMO_PASSWORD you configured):`);
  console.info(`  Placement Officer: ${admin.email}`);
  console.info(`  Trainer:           ${trainer.email}`);
  console.info(`  Students:          student01@skillsync.demo through student10@skillsync.demo`);
  console.info(`Institution code for onboarding additional placement officers: set PLACEMENT_OFFICER_INSTITUTION_ID=${institution.id} and PLACEMENT_OFFICER_INSTITUTION_CODE in .env.local.`);
  console.info("All generated records are persisted in Supabase and can be safely seeded again.");
}

await main();
