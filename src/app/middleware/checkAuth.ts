import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../errorHelpers/AppError";
import { Role, UserStatus } from "../lib/prisma-exports";
import { prisma } from "../lib/prisma";
import { cookieUtils } from "../utils/cookies";
import { jwtUtils } from "../utils/jwt";

const getBearerToken = (req: Request): string | undefined => {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        return header.slice(7).trim();
    }
    return undefined;
};

const assertUserActive = (status: UserStatus, isDeleted: boolean) => {
    if (isDeleted || status === UserStatus.DELETED) {
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            "Unauthorized access! User is deleted.",
        );
    }
    if (status === UserStatus.SUSPENDED) {
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            "Unauthorized access! User is not active.",
        );
    }
};

const assertRoleAllowed = (role: Role, authRoles: Role[]) => {
    if (authRoles.length > 0 && !authRoles.includes(role)) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Forbidden access! You do not have permission to access this resource.",
        );
    }
};

export const checkAuth =
    (...authRoles: Role[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const accessToken =
                getBearerToken(req) || cookieUtils.getCookie(req, "accessToken");

            if (accessToken) {
                const verified = jwtUtils.verifyToken(
                    accessToken,
                    envVars.ACCESS_TOKEN_SECRET,
                );

                if (verified.success && verified.decoded) {
                    const decoded = verified.decoded as {
                        userId: string;
                        role: Role;
                    };

                    const dbUser = await prisma.user.findUnique({
                        where: { id: decoded.userId },
                        select: { id: true, status: true, isDeleted: true, role: true },
                    });

                    if (!dbUser) {
                        throw new AppError(
                            StatusCodes.UNAUTHORIZED,
                            "Unauthorized access! User no longer exists.",
                        );
                    }

                    assertUserActive(dbUser.status, dbUser.isDeleted);
                    assertRoleAllowed(dbUser.role, authRoles);

                    req.user = verified.decoded as Express.Request["user"];
                    return next();
                }
            }

            const sessionToken = cookieUtils.getCookie(
                req,
                "better-auth.session_token",
            );

            if (sessionToken) {
                const session = await prisma.session.findFirst({
                    where: {
                        token: sessionToken,
                        expiresAt: { gt: new Date() },
                    },
                    include: { user: true },
                });

                if (session?.user) {
                    const { user } = session;

                    assertUserActive(user.status, user.isDeleted);
                    assertRoleAllowed(user.role, authRoles);

                    const now = new Date();
                    const expiresAt = new Date(session.expiresAt);
                    const createdAt = new Date(session.createdAt);
                    const sessionLifeTime =
                        expiresAt.getTime() - createdAt.getTime();
                    const timeRemaining = expiresAt.getTime() - now.getTime();
                    const percentRemaining =
                        (timeRemaining / sessionLifeTime) * 100;

                    if (percentRemaining < 20) {
                        res.setHeader("X-Session-Refresh", "true");
                        res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
                        res.setHeader("X-Time-Remaining", timeRemaining.toString());
                    }

                    req.user = {
                        ...user,
                        userId: user.id,
                    } as Express.Request["user"];
                    return next();
                }
            }

            throw new AppError(
                StatusCodes.UNAUTHORIZED,
                "Unauthorized access! No valid credentials provided.",
            );
        } catch (error) {
            next(error);
        }
    };
