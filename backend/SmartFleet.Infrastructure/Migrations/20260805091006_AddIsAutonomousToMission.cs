using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFleet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsAutonomousToMission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAutonomous",
                table: "Missions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAutonomous",
                table: "Missions");
        }
    }
}
