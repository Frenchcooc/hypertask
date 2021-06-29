const Hypertask = require("../dist/hypertask").default;
const TEST_AUTH_KEY = "0987654321";
const TEST_BUCKET = "my-bucket";

const Hyper = new Hypertask({ key: TEST_AUTH_KEY, bucket: TEST_BUCKET });

async function main() {
  const task = Hyper.task({ delay: 3 });
  console.log(task.id());
  if (task.id().length !== 36) {
    throw new Error("Task ID should be 36 char");
  }

  console.log(`Starting task #1 ("${task.id()}")`);

  await task.start();

  if (task.status() !== "busy") {
    throw new Error('Task #1 status should now be "busy"');
  }

  const task2 = Hyper.task({ delay: 30 });

  console.log(`Starting task #2 ("${task2.id()}")`);

  if (task.id() === task2.id()) {
    throw new Error("Tasks should have different IDs");
  }

  await task2.start();
  await task2.close();

  if (task2.status() !== "success") {
    throw new Error('Task #2 status should now be "success"');
  }
}

main();
