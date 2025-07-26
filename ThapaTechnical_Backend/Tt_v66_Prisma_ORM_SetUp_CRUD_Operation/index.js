import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

// ----------write Prisma Client queries here----------
const main = async () => {
  // -----Create a new Single user (CREATE)-----
  const user = await prisma.user.create({
    data: {
      email: "abhishekhkumar1516@gmail.com",
      name: "Abhishekh Kumar",
    },
  });
  console.log(user);

  // -----Create a new Multiple users (CREATE)-----
  const users = await prisma.user.createMany({
    data: [
      {
        email: "sagarpal1229@gmail.com",
        name: "Sagar Pal",
      },
      {
        email: "ashutoshkumar6194@gmail.com",
        name: "Ashutosh Kumar",
      },
      {
        email: "sonalkumar6194@gmail.com",
        name: "Sonam Kumari",
      },
    ],
  });
  console.log(users);

  // -----Fetch all users (READ)-----
  const allUser = await prisma.user.findMany();
  console.log(allUser);

  // ----Fetch a Single user by ID (READ)----
  const userById = await prisma.user.findUnique({
    where: { id: 1 },
  });
  console.log(userById);

  // ----Fetch a Filtred user (READ)----
  const userFilter = await prisma.user.findMany({
    where: { email: "ashutoshkumar6194@gmail.com" },
  });
  console.log(userFilter);

  // -----Update a Single user (UPDATE)-----
  const updatedUser = await prisma.user.update({
    where: { email: "sonalkumar6194@gmail.com" },
    data: { email: "sonamkumar6194@gmail.com" },
  });
  console.log(updatedUser);

  // -----Delete a Single user (DELETE)-----
  const deletedUser = await prisma.user.delete({
    where: { email: "vikashkumar2005@gmail.com" },
  });
  console.log(deletedUser);

  // -----Delete a Multiple user (DELETE)-----
  const deletedManyUsers = await prisma.user.deleteMany({
    where: { id: { in: [7, 3] } },
  });
  console.log(deletedManyUsers.count);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
