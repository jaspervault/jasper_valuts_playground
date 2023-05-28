import inquirer from 'inquirer';

async function ask_operation() {
    const questions = [
        {
            name: 'opt',
            type: 'checkbox',
            message: 'What do you want to do today:',
            choices: [
                { name: "1 Create Master Vault", value: 1 },
            ],
            validate: function (answer) {
                console.log(answer);
                if (answer.length < 1) {
                    return 'You must choose at least one topping.';
                }
                return true
            }
        },

    ];
    return inquirer.prompt(questions);
}
async function ask_account(data) {
    return inquirer.prompt([
        {
            type: 'checkbox',
            name: 'account',
            message: 'Which account?',
            choices: data
        }
    ]);
}

export default {
    ask_operation: ask_operation,
    ask_account: ask_account
}