import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

const incomeCategories = [
  { name: "Salário", icon: "banknote", color: "#22c55e" },
  { name: "Freelance", icon: "laptop", color: "#3b82f6" },
  { name: "Venda", icon: "shopping-bag", color: "#a855f7" },
  { name: "Comissão", icon: "percent", color: "#f59e0b" },
  { name: "Investimentos", icon: "trending-up", color: "#14b8a6" },
];

const expenseCategories = [
  { name: "Alimentação", icon: "utensils", color: "#ef4444" },
  { name: "Mercado", icon: "shopping-cart", color: "#f97316" },
  { name: "Combustível", icon: "fuel", color: "#eab308" },
  { name: "Transporte", icon: "car", color: "#84cc16" },
  { name: "Saúde", icon: "heart-pulse", color: "#ec4899" },
  { name: "Educação", icon: "graduation-cap", color: "#8b5cf6" },
  { name: "Lazer", icon: "party-popper", color: "#06b6d4" },
  { name: "Moradia", icon: "home", color: "#6366f1" },
  { name: "Internet", icon: "wifi", color: "#0ea5e9" },
  { name: "Energia", icon: "zap", color: "#f59e0b" },
  { name: "Água", icon: "droplet", color: "#0284c7" },
  { name: "Assinaturas", icon: "repeat", color: "#d946ef" },
];

async function main() {
  for (const c of incomeCategories) {
    await prisma.category.upsert({
      where: { id: `seed-income-${c.name}` },
      update: {},
      create: { id: `seed-income-${c.name}`, type: "INCOME", ...c },
    });
  }

  for (const c of expenseCategories) {
    await prisma.category.upsert({
      where: { id: `seed-expense-${c.name}` },
      update: {},
      create: { id: `seed-expense-${c.name}`, type: "EXPENSE", ...c },
    });
  }

  await prisma.account.upsert({
    where: { id: "seed-account-carteira" },
    update: {},
    create: {
      id: "seed-account-carteira",
      name: "Carteira",
      type: "WALLET",
      color: "#22c55e",
      icon: "wallet",
      initialBalance: 0,
      currentBalance: 0,
    },
  });

  await prisma.account.upsert({
    where: { id: "seed-account-conta-corrente" },
    update: {},
    create: {
      id: "seed-account-conta-corrente",
      name: "Conta Corrente",
      type: "CHECKING",
      color: "#6366f1",
      icon: "landmark",
      initialBalance: 0,
      currentBalance: 0,
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
