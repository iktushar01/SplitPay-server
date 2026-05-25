import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";

const lookupByEmail = catchAsync(async (req: Request, res: Response) => {
    const email = String(req.query.email ?? "");

    if (!email) {
        return sendResponse(res, {
            statusCode: StatusCodes.BAD_REQUEST,
            success: false,
            message: "Email query parameter is required",
            data: null,
        });
    }

    const result = await UserService.lookupByEmail(email);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        data: result,
    });
});

export const UserController = {
    lookupByEmail,
};
