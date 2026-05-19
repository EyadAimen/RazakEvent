import { Router } from "express";
import { authenticate, requireRole } from "../auth/auth.middleware.mjs";
import { UserEntity } from "./users.entity.mjs";
import appDataSource from "../../config/dbConfig.mjs";

const router = Router();
const userRepository = appDataSource.getRepository(UserEntity);

router.get("/", authenticate, requireRole("admin"), async (req, res) => {
    try {
        const dbUsers = await userRepository.find({
            select: {
                id: true,
                fullName: true,
                email: true,
                staffOrMatricId: true,
                role: true
            },
            order: {
                fullName: "ASC"
            }
        });

        return res.status(200).json({
            success: true,
            data: dbUsers
        });
    } catch (error) {
        console.error("Error in GET /api/users via TypeORM:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching user roles."
        });
    }
});

router.patch("/profile", authenticate, async (req, res) => {
    const { fullName } = req.body;

    if (!fullName || !fullName.trim()) {
        return res.status(400).json({
            success: false,
            message: "Full name is required."
        });
    }

    try {
        const user = await userRepository.findOneBy({ id: req.user.userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        await userRepository.update(req.user.userId, { fullName: fullName.trim() });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: {
                id: user.id,
                fullName: fullName.trim(),
                email: user.email,
                staffOrMatricId: user.staffOrMatricId,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
            }
        });
    } catch (error) {
        console.error("Error in PATCH /api/users/profile via TypeORM:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error updating profile."
        });
    }
});

router.patch("/:id/role", authenticate, requireRole("admin"), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({
            success: false,
            message: "Role value is required."
        });
    }

    try {
        const user = await userRepository.findOneBy({ id: id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        let cleanRole = role.toLowerCase().trim().replace(/\s+/g, "");
        if (cleanRole === "clublead") {
            cleanRole = "lead";
        }

        const validRoles = ["student", "member", "lead", "admin"];
        if (!validRoles.includes(cleanRole)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role value. Must be one of: ${validRoles.join(", ")}`
            });
        }

        await userRepository.update(id, { role: cleanRole });

        return res.status(200).json({
            success: true,
            message: "User role updated successfully.",
            data: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                staffOrMatricId: user.staffOrMatricId,
                role: cleanRole
            }
        });
    } catch (error) {
        console.error(`Error in PATCH /api/users/${id}/role via TypeORM:`, error);
        return res.status(500).json({
            success: false,
            message: "Internal server error updating user role."
        });
    }
});

export default router;