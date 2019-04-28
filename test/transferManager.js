const ERC677BridgeToken = artifacts.require("ERC677BridgeToken.sol");
const CommunityTransferManager = artifacts.require("CommunityTransferManager.sol");
const EntitiesList = artifacts.require("EntitiesList.sol");

const { ERROR_MSG, ZERO_ADDRESS } = require('./setup');
require('./helpers/helpers');

const NO_PERM = '0x0000000000000000000000000000000000000000000000000000000000000000'
const USER_PERM = '0x0000000000000000000000000000000000000000000000000000000000000001'
const BUSINESS_PERM = '0x0000000000000000000000000000000000000000000000000000000000000002'
const ADMIN_PERM = '0x0000000000000000000000000000000000000000000000000000000000000003'

contract('CommunityTransferManager', async (accounts) => {
    let token
    let transferManager
    const owner = accounts[0]
    const notOwner = accounts[1]
    const user = accounts[2]
    const anotherUser = accounts[3]

    const validateEntity = async (account, entity) => {
        const [uri, permissions] = await entitiesList.entityOf(account).should.be.fulfilled
        assert.equal(entity.uri, uri)
        assert.equal(entity.permissions, permissions)
    }

    const validateNoEntity = (account) => validateEntity(account, {uri: '', permissions: NO_PERM}) 

    beforeEach(async () => {
        token = await ERC677BridgeToken.new("Fuse ERC20", "FUSS20", 18);
        transferManager = await CommunityTransferManager.new()
        entitiesList = await EntitiesList.at(await transferManager.entitiesList())
    })

    describe('#constructor', () => {
        it('creator is admin of the community', async () => {
            entity = {uri: '', permissions: ADMIN_PERM}
            transferManager = await CommunityTransferManager.new()
            await validateEntity(owner, entity)
        })
    })

    describe('#setTransferManager', () => {
        it('can set Transfer Manager', async () => {
            await token.setTransferManager(transferManager.address).should.be.fulfilled
            assert.equal(await token.transferManager(), transferManager.address)
        })

        it('only owner can set Transfer Manager', async () => {
            await token.setTransferManager(transferManager.address, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
            assert.equal(await token.transferManager(), ZERO_ADDRESS)
        })
    })
    describe('#join', async () => {

        it('user can join community', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            await transferManager.join(entity.uri, {from: user}).should.be.fulfilled
            await validateEntity(user, entity)
        })

        it('user cannot join twice ', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            await transferManager.join(entity.uri, {from: user}).should.be.fulfilled
            await validateEntity(user, entity)

            await transferManager.join(entity.uri, {from: user}).should.be.rejectedWith(ERROR_MSG)
        })
    })

    describe('#addUser', async () => {

        it('owner can add user', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            await transferManager.addUser(user, entity.uri, {from: owner}).should.be.fulfilled
            await validateEntity(user, entity)
        })

        it('only owner can add user', async () => {
            const entity = {uri: ''}
            await transferManager.addUser(user, entity.uri, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
            await validateNoEntity(user)
        })

        it('can add multiple user', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            const anotherEntity = {uri: 'uri2', permissions: USER_PERM}

            await transferManager.addUser(user, entity.uri, {from: owner}).should.be.fulfilled
            await transferManager.addUser(anotherUser, anotherEntity.uri, {from: owner}).should.be.fulfilled

            await validateEntity(user, entity)
            await validateEntity(anotherUser, anotherEntity)
        })

        it('cannot add same user twice', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            const anotherEntity = {uri: 'uri2', permissions: USER_PERM}

            await transferManager.addUser(user, entity.uri, {from: owner}).should.be.fulfilled
            await transferManager.addUser(user, anotherEntity.uri, {from: owner}).should.be.rejectedWith(ERROR_MSG)

            await validateEntity(user, entity)
        })
    })

    describe('#addBusiness', async () => {

        it('owner can add business', async () => {
            const entity = {uri: 'uri', permissions: BUSINESS_PERM}
            await transferManager.addBusiness(user, entity.uri, {from: owner}).should.be.fulfilled
            await validateEntity(user, entity)
        })

        it('only owner can add business', async () => {
            const entity = {uri: 'uri'}
            await transferManager.addBusiness(user, entity.uri, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
            await validateNoEntity(user)
        })
    })

    describe('#addBusiness', async () => {

        it('owner can add admin', async () => {
            const entity = {uri: 'uri', permissions: ADMIN_PERM}
            await transferManager.addAdmin(user, entity.uri, {from: owner}).should.be.fulfilled
            await validateEntity(user, entity)
        })

        it('only owner can add admin', async () => {
            const entity = {uri: 'uri'}
            await transferManager.addAdmin(user, entity.uri, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
            await validateNoEntity(user)
        })
    })

    describe('#removeEntity', async () => {
        const entity = {uri: 'uri', permissions: USER_PERM}

        beforeEach(async () => {
            await transferManager.addUser(user, entity.uri, {from: owner}).should.be.fulfilled
        })
        it('owner can remove entity', async () => {
            await transferManager.removeEntity(user, {from: owner}).should.be.fulfilled
            await validateNoEntity(user)
        })

        it('only owner can add remove entity', async () => {
            await transferManager.removeEntity(user, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
            await validateEntity(user, entity)
        })
    })

    describe('#updateEntityUri', async () => {
        const entity = {uri: 'uri', permissions: USER_PERM}

        beforeEach(async () => {
            await transferManager.addUser(user, entity.uri, {from: owner}).should.be.fulfilled
        })
        it('owner can update entity uri', async () => {
            const uri = 'newuri'
            await transferManager.updateEntityUri(user, uri, {from: owner}).should.be.fulfilled
            await validateEntity(user, {...entity, uri})
        })

        it('only owner can update entity uri', async () => {
            const uri = 'newuri'

            await transferManager.updateEntityUri(user, uri, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
            await validateEntity(user, entity)
        })
    })

    describe('#verifyTransfer', async () => {
        // beforeEach(async () => {
        //     await token.verifyTransfer(transferManager.address)
        // })

        it('if users not in registered, verifyTransfer is false', async () => {
            assert.isNotOk(await transferManager.verifyTransfer(owner, notOwner, 1))
        })
    })
    

})