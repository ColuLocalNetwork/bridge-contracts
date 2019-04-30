const ERC677BridgeToken = artifacts.require("ERC677BridgeToken.sol");
const CommunityTransferManager = artifacts.require("./mockContracts/CommunityTransferManagerMock.sol");
const EntitiesList = artifacts.require("EntitiesList.sol");

const { ERROR_MSG, ZERO_ADDRESS } = require('./setup');
require('./helpers/helpers');

const USER_MASK = '0x0000000000000000000000000000000000000000000000000000000000000001'
const ADMIN_MASK = '0x0000000000000000000000000000000000000000000000000000000000000002'
const APPROVED_MASK = '0x0000000000000000000000000000000000000000000000000000000000000004'
const BUSINESS_MASK = '0x0000000000000000000000000000000000000000000000000000000000000008'

const NO_PERM = '0x0000000000000000000000000000000000000000000000000000000000000000'
const USER_PERM = '0x0000000000000000000000000000000000000000000000000000000000000001'
const ADMIN_PERM = '0x0000000000000000000000000000000000000000000000000000000000000003' // user + admin
const APPROVED_USER_PERM = '0x0000000000000000000000000000000000000000000000000000000000000005' // user + approved

const BUSINESS_PERM = '0x000000000000000000000000000000000000000000000000000000000000000b' // user + approved + business

contract('CommunityTransferManager', async (accounts) => {
    let token
    let transferManager
    const owner = accounts[0]
    const notOwner = accounts[1]
    const user = accounts[2]
    const anotherUser = accounts[3]
    const business = accounts[4]

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

    // describe('test', () => {
    //     it('test', async () => {
    //         console.log(transferManager.contract)
    //         console.log(transferManager.contract.addRule)
    //         console.log(transferManager.contract.addRule['bytes32,bytes32,bool,uint256'])
    //     })
    // })

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

    describe('#addEntity', async () => {

        it('owner can add user', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: owner}).should.be.fulfilled
            await validateEntity(user, entity)
        })

        it('only owner can add user', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
            await validateNoEntity(user)
        })

        it('owner can add business', async () => {
            const entity = {uri: 'uri', permissions: BUSINESS_PERM}
            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: owner}).should.be.fulfilled
            await validateEntity(user, entity)
        })

        it('owner can add admin', async () => {
            const entity = {uri: 'uri', permissions: ADMIN_PERM}
            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: owner}).should.be.fulfilled
            await validateEntity(user, entity)
            assert.isOk(await entitiesList.hasPermission(user, ADMIN_MASK).should.be.fulfilled)

        })

        it('can add multiple user', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            const anotherEntity = {uri: 'uri2', permissions: USER_PERM}

            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: owner}).should.be.fulfilled
            await transferManager.addEntity(anotherUser, anotherEntity.uri, anotherEntity.permissions, {from: owner}).should.be.fulfilled

            await validateEntity(user, entity)
            await validateEntity(anotherUser, anotherEntity)
        })

        it('cannot add same user twice', async () => {
            const entity = {uri: 'uri', permissions: USER_PERM}
            const anotherEntity = {uri: 'uri2', permissions: USER_PERM}

            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: owner}).should.be.fulfilled
            await transferManager.addEntity(user, anotherEntity.uri, anotherEntity.permissions, {from: owner}).should.be.rejectedWith(ERROR_MSG)

            await validateEntity(user, entity)
        })
    })

    describe('#removeEntity', async () => {
        const entity = {uri: 'uri', permissions: USER_PERM}

        beforeEach(async () => {
            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: owner}).should.be.fulfilled
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
            await transferManager.addEntity(user, entity.uri, entity.permissions, {from: owner}).should.be.fulfilled
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

    describe('#addRule', async () => {
        it('owner can add rule', async () => {
            await transferManager.addRule(ADMIN_PERM, NO_PERM, {from: owner}).should.be.fulfilled
        })

        it('only owner can add rule', async () => {
            await transferManager.addRule(ADMIN_PERM, NO_PERM, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
        })


        it('cannot add more than 20 rules', async () => {
            for (let i=0; i < 20; i++) {
                await transferManager.addRule(USER_MASK, USER_MASK, {from: owner}).should.be.fulfilled
            }
            await transferManager.addRule(USER_MASK, USER_MASK, {from: owner}).should.be.rejectedWith(ERROR_MSG)
        })
    })


    describe('#removeRule', async () => {
        beforeEach(async () => {
            await transferManager.addRule(USER_PERM, USER_PERM, {from: owner}).should.be.fulfilled
        })

        it('owner can remove rule', async () => {
            await transferManager.removeRule(0, {from: owner}).should.be.fulfilled
        })

        it('only owner can remove rule', async () => {
            await transferManager.removeRule(0, {from: notOwner}).should.be.rejectedWith(ERROR_MSG)
        })

        it('cannot remove rule with wrong index', async () => {
            await transferManager.removeRule(1, {from: owner}).should.be.rejectedWith(ERROR_MSG)
        })
    })

    describe('#verifyTransfer', () => {

        describe('#no rules given', () => {
            it('not joined users can transfer', async () => {
                assert.isOk(await transferManager.verifyTransfer(user, anotherUser, 1))
            })

            it('joined users can transfer', async () => {
                await transferManager.join('uri', {from: user}).should.be.fulfilled
                await transferManager.join('anotherUri', {from: anotherUser}).should.be.fulfilled
    
                assert.isOk(await transferManager.verifyTransfer(user, anotherUser, 1))
                assert.isOk(await transferManager.verifyTransfer(anotherUser, user, 1))
            })
        })

        describe('#rule: only joined users', () => {
            beforeEach(async () => {
                await transferManager.addRule(USER_PERM, USER_PERM, {from: owner}).should.be.fulfilled
            })

            it('if both users are not joined, verifyTransfer is false', async () => {
                assert.isNotOk(await transferManager.verifyTransfer(user, anotherUser, 1))
            })

            it('if sender is not registered, verifyTransfer is false', async () => {
                await transferManager.join('uri', {from: anotherUser}).should.be.fulfilled
    
                assert.isNotOk(await transferManager.verifyTransfer(user, anotherUser, 1))
            })
    
            it('if receiver is not registered, verifyTransfer is false', async () => {
                await transferManager.join('uri', {from: user}).should.be.fulfilled
    
                assert.isNotOk(await transferManager.verifyTransfer(user, anotherUser, 1))
            })

            it('joined users can transfer', async () => {
                await transferManager.join('uri', {from: user}).should.be.fulfilled
                await transferManager.join('anotherUri', {from: anotherUser}).should.be.fulfilled
    
                assert.isOk(await transferManager.verifyTransfer(user, anotherUser, 1))
                assert.isOk(await transferManager.verifyTransfer(anotherUser, user, 1))
            })

            describe('#rule: only admin can transfer to everyone', () => {
                beforeEach(async () => {
                    await transferManager.addRule(ADMIN_PERM, NO_PERM, {from: owner}).should.be.fulfilled    
                })

                it('admin can transfer to not joined users ', async () => {
                    assert.isOk(await transferManager.verifyTransfer(owner, user, 1))
                    assert.isNotOk(await transferManager.verifyTransfer(anotherUser, user, 1))
                })

                it('only admin can transfer to not joined users ', async () => {
                    assert.isOk(await transferManager.verifyTransfer(owner, user, 1))
                    assert.isNotOk(await transferManager.verifyTransfer(anotherUser, user, 1))
                })
            })


            describe('#rule: users can transfer only to businesses', () => {
                beforeEach(async () => {
                    await transferManager.addRule(USER_MASK, BUSINESS_MASK, {from: owner}).should.be.fulfilled    
                    await transferManager.addEntity(business, 'uri', BUSINESS_PERM, {from: owner}).should.be.fulfilled
                    await transferManager.join('uri', {from: user}).should.be.fulfilled
                })

                it('user can transfer to business ', async () => {
                    assert.isOk(await transferManager.verifyTransfer(user, business, 1))
                })

                it('business cannot transfer to user ', async () => {
                    assert.isOk(await transferManager.verifyTransfer(business, user , 1))
                })
            })
        })

        describe('#rule: joined users can tranfer max 10 wei', () => {
            beforeEach(async () => {
                await transferManager.addRuleFullParams(USER_PERM, USER_PERM, true, 10, {from: owner})

                await transferManager.join('uri', {from: user}).should.be.fulfilled
                await transferManager.join('anotherUri', {from: anotherUser}).should.be.fulfilled
            })

            it('joined users can transfer 5 wei ', async () => {
                assert.isOk(await transferManager.verifyTransfer(user, anotherUser, 5))
            })

            it('joined users can transfer 10 wei ', async () => {
                assert.isOk(await transferManager.verifyTransfer(user, anotherUser, 10))
            })


            it('joined users cannot transfer nore than 10 wei ', async () => {
                assert.isNotOk(await transferManager.verifyTransfer(user, anotherUser, 11))
            })
        })

        describe('#rule: joined users can tranfer min 10 wei', () => {
            beforeEach(async () => {
                await transferManager.addRuleFullParams(USER_PERM, USER_PERM, false, 10, {from: owner})

                await transferManager.join('uri', {from: user}).should.be.fulfilled
                await transferManager.join('anotherUri', {from: anotherUser}).should.be.fulfilled
            })

            it('joined users can transfer 5 wei ', async () => {
                assert.isOk(await transferManager.verifyTransfer(user, anotherUser, 15))
            })

            it('joined users can transfer 10 wei ', async () => {
                assert.isOk(await transferManager.verifyTransfer(user, anotherUser, 10))
            })


            it('joined users cannot transfer nore than 10 wei ', async () => {
                assert.isNotOk(await transferManager.verifyTransfer(user, anotherUser, 5))
            })
        })
    })
})
