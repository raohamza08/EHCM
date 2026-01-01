$env:PATH += ";C:\Program Files\nodejs"
npx prisma db push
npx prisma generate
npm run dev
