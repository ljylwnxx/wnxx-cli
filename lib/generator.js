const { getRepoList, getTagList } = require('./http')
const ora = require('ora')
const inquirer = require('inquirer')
const util = require('util')
const path = require('path')
const downloadGitRepo = require('download-git-repo') // 不支持 Promise
const chalk = require('chalk')
async function wrapLoading(fn, message, ...args) {
    // 使用 ora 初始化，传入提示信息 message
    const spinner = ora(message);
    // 开始加载动画
    spinner.start();
    try {
        // 执行传入方法 fn
        const result = await fn(...args);
        // 状态为修改为成功
        spinner.succeed();
        return result
    } catch (error) {
        // 状态为修改为失败
        spinner.fail('Request failed, refetch ...')
    }
}
class Generator {
    constructor(name, targetDir) {
        this.name = name
        this.targetDir = targetDir
        // 改造 download-git-repo 支持 promise
        this.downloadGitRepo = util.promisify(downloadGitRepo);
        // this.downloadGitRepo = downloadGitRepo;
    }
    // 请求接口拿到自己定义的模板
    // 从远程拉取模板数据
    // 用户选择自己想下载的模板名称
    // return 用户选择的名称
    async getRepo() {
        let repoList = await wrapLoading(getRepoList, 'waiting fetch template')
        if (!repoList) return;
        // 过滤我们需要的模板名称filter
        const repos = repoList.filter(i => i.is_template).map(item => item.name);
        // 2）用户选择自己新下载的模板名称
        const { repo } = await inquirer.prompt({
            name: 'repo',
            type: 'list',
            choices: repos,
            message: 'Please choose a template to create project'
        })

        // 3）return 用户选择的名称
        return repo;
    }
    // 下载远程模板
    // 1）拼接下载地址
    // 2）调用下载方法
    async download(repo, tag) {
        // 1）拼接下载地址
        // const requestUrl = `zhurong-cli/${repo}${tag?'#'+tag:''}`;
        const requestUrl = `json1204/${repo}`;
        // 2）调用下载方法
        await wrapLoading(
            this.downloadGitRepo, // 远程下载方法
            'waiting download template', // 加载提示信息
            requestUrl, // 参数1: 下载地址
            path.resolve(process.cwd(), this.targetDir)) // 参数2: 创建位置

    }
    async create() {
        // 1）获取模板名称
        const repo = await this.getRepo()

        // 2) 获取 tag 名称
        // const tag = await this.getTag(repo)

        // 3）下载模板到模板目录
        // await this.download(repo, tag)
        await this.download(repo)

        console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
        console.log(`\r\n  cd ${chalk.cyan(this.name)}`)
        console.log('  npm run dev\r\n')
    }
}
module.exports = Generator