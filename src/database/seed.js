import { db } from '../config/db.js';
import { users, agents } from './schema.js';
import { eq } from 'drizzle-orm';

const seed = async () => {
    try {
        console.log('Seeding database...');

        // Insert root agent user
        const [rootUser] = await db.insert(users).values({
            username: 'ROOT1',
            firstName: 'Root',
            lastName: 'Agent',
            password: 'test',
            blocked: false,
            role: 'AGENT'
        })
        .onDuplicateKeyUpdate({
            set: {
                firstName: 'Root',
                lastName: 'Agent'
            }
        });

        // Get the user to get their ID
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, 'ROOT1'));

        // Insert into agents table
        await db.insert(agents).values({
            userId: user.id
        })
        .onDuplicateKeyUpdate({
            set: {
                userId: user.id
            }
        });

        console.log('Seeding completed!');


        console.log("Press Ctrl+C to exit...")

    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

seed();
