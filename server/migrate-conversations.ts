import { db } from "./db";
import { conversations, messages, households, householdMembers } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function migrateToConversations() {
  console.log("Starting conversation migration...");
  
  try {
    // First, create household conversations for all existing households
    const allHouseholds = await db.select().from(households);
    
    for (const household of allHouseholds) {
      // Get all members of this household
      const members = await db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.householdId, household.id));
      
      const participantIds = members.map(m => m.userId);
      
      // Create household conversation
      const [conversation] = await db
        .insert(conversations)
        .values({
          type: 'household',
          householdId: household.id,
          participantIds,
          name: household.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();
      
      if (conversation) {
        console.log(`Created conversation for household: ${household.name}`);
      }
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run migration
migrateToConversations().then(() => process.exit(0));