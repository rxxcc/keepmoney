import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { requireUser } from '../middleware/requireUser';
import { validate } from '../middleware/validateResource';
import {
    CreateTransactionInput,
    createTransactionSchema,
    getSingleTransactionParams,
    getSingleTransactionSchema,
    getTransactionsParams,
    getTransactionsSchema
} from '../schema/transaction.schema';
import { findSingleBudget } from '../services/budget.services';
import {
    createTransaction,
    deleteSingleTransaction,
    getSingleTransaction,
    getTransactions,
    updateSingleTransaction
} from '../services/transaction.services';

const router = express.Router();

router.route("/budget/:budgetId/transactions")
    .post(requireUser, validate(createTransactionSchema),
        async (req: Request<CreateTransactionInput['params'], {}, CreateTransactionInput['body']>, res: Response) => {
            const { budgetId } = req.params;
            // @ts-ignore
            const { id } = req.user;

            const budget = await findSingleBudget({ budgetId });
            if (!budget) {
                throw new Error("budget not found");
            }

            if (budget.userId !== id) {
                throw new Error('unauthenticated');
            }

            req.body.owner = budget._id;

            const transaction = await createTransaction({ ...req.body });

            if (transaction.type === "Credit") {
                budget.amount = Number(budget.amount) + Number(transaction.amount);
            } else if (transaction.type === "Expenses") {
                budget.amount = Number(budget.amount) - Number(transaction.amount);
            }

            budget.transactions.push(transaction);

            budget.save();

            res.status(StatusCodes.OK).json({ msg: "success", data: transaction });
        }
    ).
    get(requireUser, validate(getTransactionsSchema),
        async (req: Request<getTransactionsParams['params']>, res: Response) => {
            const { budgetId } = req.params;
            // @ts-ignore
            const { id } = req.user;

            const budget = await findSingleBudget({ budgetId });
            if (!budget) {
                throw new Error("budget not found");
            }

            if (budget.userId !== id) {
                throw new Error('unauthenticated');
            }

            const transaction = await getTransactions({ owner: budget._id })

            res.status(StatusCodes.OK).json({ msg: "success", transaction })
        }
    );

router.route("/budget/:budgetId/transactions/:transactionId")
    .get(requireUser, validate(getSingleTransactionSchema),
        async (req: Request<getSingleTransactionParams['params']>, res: Response) => {
            const { budgetId, transactionId } = req.params;
            // @ts-ignore
            const { id } = req.user;

            const budget = await findSingleBudget({ budgetId });
            if (!budget) {
                throw new Error('budget with this id does not exist');
            }

            if (budget.userId !== id) {
                throw new Error('you are not authenticated to access this resource');
            }

            const transaction = await getSingleTransaction({ transactionId });
            if (!transaction) {
                throw new Error('transaction does not exist')
            }

            res.status(StatusCodes.OK).json({ msg: "success", transaction });
        }
    )
    .patch(requireUser, validate(getSingleTransactionSchema),
        async (req: Request<getSingleTransactionParams['params']>, res: Response) => {
            const { budgetId, transactionId } = req.params;
            // @ts-ignore
            const { id } = req.user;

            const budget = await findSingleBudget({ budgetId });
            if (!budget) {
                throw new Error('budget with this id does not exist');
            }

            if (budget.userId !== id) {
                throw new Error('you are not authenticated to access this resource');
            }

            const trnx = await getSingleTransaction({ transactionId });
            if (!trnx) {
                throw new Error('transaction does not exist');
            }

            const updateTrnx = await updateSingleTransaction(
                { _id: trnx._id },
                { ...req.body },
                { new: true, runValidators: true }
            );

            res.status(StatusCodes.OK).json({ msg: "success", transaction: updateTrnx });

        }
    )
    .delete(requireUser, validate(getSingleTransactionSchema),
        async (req: Request<getSingleTransactionParams['params']>, res: Response) => {
            const { budgetId, transactionId } = req.params;
            // @ts-ignore
            const { id } = req.user;

            const budget = await findSingleBudget({ budgetId });
            if (!budget) {
                throw new Error('budget with this id does not exist');
            }

            if (budget.userId !== id) {
                throw new Error('you are not authenticated to access this resource');
            }

            const trnx = await getSingleTransaction({ transactionId });
            if (!trnx) {
                throw new Error('transaction does not exist');
            }

            await deleteSingleTransaction({ _id: trnx._id });

            res.status(StatusCodes.OK).json({ msg: "transaction deleted successfully" });
        }
    )


export {
    router as transactionRouter
};