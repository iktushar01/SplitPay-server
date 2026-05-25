import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { UserStatus } from "../../lib/prisma-exports";
import { prisma } from "../../lib/prisma";

const lookupByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
            isDeleted: true,
        },
    });

    if (
        !user ||
        user.isDeleted ||
        user.status === UserStatus.DELETED
    ) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
    };
};

export const UserService = {
    lookupByEmail,
};
