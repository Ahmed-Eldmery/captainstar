
# Captain Star Agency Dashboard 🚀

Internal marketing agency tool for Captain Star (Saudi Arabia), with AI-powered features.

## Supabase Integration (Activation)

To activate the database on Supabase:

1. **Create a Project** on [Supabase](https://supabase.com).
2. **Get Connection String**: Go to Project Settings > Database and copy the `Transaction` or `Session` connection string.
3. **Set Environment Variables**:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   API_KEY="[YOUR-GEMINI-API-KEY]"
   ```
4. **Push Schema**:
   Run the following command to create tables in Supabase:
   ```bash
   npx prisma db push
   ```
5. **Seed Database**:
   ```bash
   npx prisma db seed
   ```

## Team Role Permissions

| Role | Primary Access | Restrictions |
|------|----------------|--------------|
| **Sales** | Client CRM, Lead management | No Task/Project management |
| **Media Buyer** | Performance Reports, Budgets | No Creative editing |
| **Designer/Editor** | Task Kanban, Asset Library | No Client financial data |
| **Account Manager** | Full workflow, Approvals | Limited Admin settings |
| **Admin** | Full Access, Activity Logs | None |

## Getting Started

1. `npm install`
2. Connect Supabase (steps above)
3. `npm run dev`
