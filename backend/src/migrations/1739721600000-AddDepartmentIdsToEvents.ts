import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentIdsToEvents1739721600000 implements MigrationInterface {
  name = 'AddDepartmentIdsToEvents1739721600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "departmentIds" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "departmentIds"`);
  }
}
