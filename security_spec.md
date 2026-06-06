# Security Spec: Agora Classroom Reasoning Portal

## 1. Data Invariants
1. **Quiz Ownership**: A quiz must belong to an authenticated teacher. No other teacher can edit or delete another teacher's quiz.
2. **Room Management**: Only the teacher who created a room can manage its state, start activities, change pacing, or stop quizzes.
3. **Student Isolation**: Students can read the active room's configuration and create/update their own participant record inside the room's participant subcollection. They cannot alter other students' records or the room's central configurations.
4. **Teacher-Led Progression**: Students cannot modify room-wide variable states such as `activeQuestionIndex`.

## 2. The Dirty Dozen Payloads
Below are 12 malicious payloads designed to audit and bypass Agora's security rules:

1. **Spoofed Teacher Quiz Creation**: Create a quiz with `teacherId` set to a different user's UID.
2. **Unauthenticated Quiz Creation**: Attempt to create a quiz without being logged in.
3. **Malicious Quiz Modification**: Change the `teacherId` of an existing quiz to steal ownership.
4. **Unauthorized Quiz Listing**: Query and list all quizzes belonging to other teachers.
5. **Unauthorized Quiz Deletion**: Try to delete a quiz owned by another teacher.
6. **Malicious Room Takeover**: Update a room's `teacherId` or active quiz to hack the teacher control panel.
7. **Unauthenticated Room Creation**: Start an active room without teacher authentication.
8. **Direct Room State Manipulation**: A student attempting to increment `activeQuestionIndex` on the central room document.
9. **Student Impersonation (Cross-Student Write)**: A script trying to write answers to another student's participant document in a room.
10. **Malicious Participant Spam**: Creating or writing participant documents with extremely large name payloads (Denial-of-Wallet).
11. **Premature Session Ending**: Unauthenticated deletion of a room's active participants.
12. **Tampering with Closed Session Answers**: A student trying to update their score or progress after `completed` has been marked as `true` (terminal state locking).

## 3. Recommended Security Rules Framework (`firestore.rules`)
A custom test suite should evaluate each collection against permission boundaries to ensure all unauthorized actions return `PERMISSION_DENIED`. We will write and deploy highly hardened rules implementing validations and structural locks.
