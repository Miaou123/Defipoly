/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/memeopoly_program.json`.
 */
export type MemeopolyProgram = {
  "address": "Fx8rVmiwHiBuB28MWDAaY68PXRmZLTsXsf2SJ6694oFi",
  "metadata": {
    "name": "memeopolyProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "activateShield",
      "discriminator": [
        84,
        221,
        108,
        82,
        168,
        124,
        77,
        235
      ],
      "accounts": [
        {
          "name": "property"
        },
        {
          "name": "ownership",
          "writable": true
        },
        {
          "name": "playerAccount"
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "rewardPoolVault",
          "writable": true
        },
        {
          "name": "devTokenAccount",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "slotsToShield",
          "type": "u16"
        }
      ]
    },
    {
      "name": "buyProperty",
      "discriminator": [
        128,
        136,
        62,
        184,
        252,
        187,
        128,
        130
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "ownership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  119,
                  110,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "setCooldown",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  108,
                  100,
                  111,
                  119,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "account",
                "path": "property.set_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "setOwnership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  116,
                  95,
                  111,
                  119,
                  110,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "account",
                "path": "property.set_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "setStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  116,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "property.set_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "playerAccount",
          "writable": true
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "rewardPoolVault",
          "writable": true
        },
        {
          "name": "devTokenAccount",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claimRewards",
      "discriminator": [
        4,
        144,
        132,
        71,
        116,
        23,
        151,
        80
      ],
      "accounts": [
        {
          "name": "playerAccount",
          "writable": true
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "rewardPoolVault",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "numProperties",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closeStealRequest",
      "discriminator": [
        21,
        231,
        225,
        194,
        62,
        54,
        152,
        17
      ],
      "accounts": [
        {
          "name": "stealRequest",
          "writable": true
        },
        {
          "name": "rentReceiver",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeGame",
      "discriminator": [
        44,
        62,
        102,
        247,
        126,
        208,
        130,
        215
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "rewardPoolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  119,
                  97,
                  114,
                  100,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "initialRewardPoolAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializePlayer",
      "discriminator": [
        79,
        249,
        88,
        177,
        220,
        62,
        56,
        128
      ],
      "accounts": [
        {
          "name": "playerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeProperty",
      "discriminator": [
        94,
        188,
        21,
        36,
        186,
        50,
        195,
        141
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "propertyId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "propertyId",
          "type": "u8"
        },
        {
          "name": "setId",
          "type": "u8"
        },
        {
          "name": "maxSlotsPerProperty",
          "type": "u16"
        },
        {
          "name": "maxPerPlayer",
          "type": "u16"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "yieldPercentBps",
          "type": "u16"
        },
        {
          "name": "shieldCostPercentBps",
          "type": "u16"
        },
        {
          "name": "cooldownSeconds",
          "type": "i64"
        }
      ]
    },
    {
      "name": "pauseGame",
      "discriminator": [
        133,
        116,
        165,
        66,
        173,
        81,
        10,
        85
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "sellProperty",
      "discriminator": [
        215,
        84,
        1,
        16,
        41,
        51,
        55,
        203
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "ownership",
          "writable": true
        },
        {
          "name": "playerAccount",
          "writable": true
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "rewardPoolVault",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "slots",
          "type": "u16"
        }
      ]
    },
    {
      "name": "stealPropertyFulfill",
      "docs": [
        "Step 2: Reveal and execute steal with secure randomness"
      ],
      "discriminator": [
        236,
        199,
        187,
        146,
        16,
        9,
        162,
        165
      ],
      "accounts": [
        {
          "name": "property"
        },
        {
          "name": "stealRequest",
          "writable": true
        },
        {
          "name": "targetOwnership",
          "writable": true
        },
        {
          "name": "attackerOwnership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  119,
                  110,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "steal_request.attacker",
                "account": "stealRequest"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "attackerAccount",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "slotHashes",
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "stealPropertyRequest",
      "docs": [
        "Step 1: Commit to steal with user randomness"
      ],
      "discriminator": [
        230,
        1,
        72,
        63,
        142,
        62,
        71,
        192
      ],
      "accounts": [
        {
          "name": "property"
        },
        {
          "name": "targetOwnership"
        },
        {
          "name": "stealRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  101,
                  97,
                  108,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "attacker"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "playerAccount",
          "writable": true
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "rewardPoolVault",
          "writable": true
        },
        {
          "name": "devTokenAccount",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "targetPlayer",
          "type": "pubkey"
        },
        {
          "name": "isTargeted",
          "type": "bool"
        },
        {
          "name": "userRandomness",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "unpauseGame",
      "discriminator": [
        52,
        251,
        30,
        83,
        140,
        62,
        220,
        243
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "updatePhase",
      "discriminator": [
        192,
        90,
        97,
        235,
        207,
        129,
        59,
        5
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newPhase",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updatePropertyMaxSlots",
      "discriminator": [
        248,
        46,
        67,
        110,
        19,
        233,
        57,
        235
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "propertyId",
          "type": "u8"
        },
        {
          "name": "newMaxSlots",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updatePropertyPrice",
      "discriminator": [
        26,
        120,
        255,
        136,
        9,
        83,
        139,
        105
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true
        },
        {
          "name": "gameConfig"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "propertyId",
          "type": "u8"
        },
        {
          "name": "newPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateStealChances",
      "discriminator": [
        76,
        217,
        146,
        47,
        85,
        209,
        173,
        3
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "targetedBps",
          "type": "u16"
        },
        {
          "name": "randomBps",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gameConfig",
      "discriminator": [
        45,
        146,
        146,
        33,
        170,
        69,
        96,
        133
      ]
    },
    {
      "name": "playerAccount",
      "discriminator": [
        224,
        184,
        224,
        50,
        98,
        72,
        48,
        236
      ]
    },
    {
      "name": "playerSetCooldown",
      "discriminator": [
        135,
        20,
        47,
        188,
        17,
        159,
        96,
        123
      ]
    },
    {
      "name": "playerSetOwnership",
      "discriminator": [
        246,
        100,
        31,
        189,
        6,
        148,
        229,
        99
      ]
    },
    {
      "name": "property",
      "discriminator": [
        195,
        247,
        69,
        181,
        195,
        47,
        152,
        19
      ]
    },
    {
      "name": "propertyOwnership",
      "discriminator": [
        245,
        240,
        179,
        197,
        116,
        60,
        248,
        94
      ]
    },
    {
      "name": "setStats",
      "discriminator": [
        94,
        47,
        130,
        178,
        226,
        11,
        2,
        222
      ]
    },
    {
      "name": "stealRequest",
      "discriminator": [
        239,
        138,
        203,
        189,
        107,
        137,
        18,
        158
      ]
    }
  ],
  "events": [
    {
      "name": "adminUpdateEvent",
      "discriminator": [
        254,
        174,
        166,
        166,
        35,
        154,
        22,
        143
      ]
    },
    {
      "name": "propertyBoughtEvent",
      "discriminator": [
        233,
        97,
        56,
        154,
        112,
        136,
        181,
        220
      ]
    },
    {
      "name": "propertySoldEvent",
      "discriminator": [
        2,
        169,
        156,
        198,
        198,
        248,
        149,
        115
      ]
    },
    {
      "name": "rewardsClaimedEvent",
      "discriminator": [
        22,
        1,
        42,
        183,
        250,
        8,
        157,
        146
      ]
    },
    {
      "name": "shieldActivatedEvent",
      "discriminator": [
        210,
        41,
        91,
        63,
        175,
        240,
        161,
        163
      ]
    },
    {
      "name": "stealFailedEvent",
      "discriminator": [
        102,
        112,
        94,
        162,
        248,
        242,
        245,
        123
      ]
    },
    {
      "name": "stealRequestedEvent",
      "discriminator": [
        220,
        209,
        112,
        136,
        155,
        133,
        194,
        155
      ]
    },
    {
      "name": "stealSuccessEvent",
      "discriminator": [
        173,
        237,
        85,
        193,
        182,
        54,
        214,
        51
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPropertyId",
      "msg": "Invalid property ID (must be 0-21)"
    },
    {
      "code": 6001,
      "name": "invalidSetId",
      "msg": "Invalid set ID (must be 0-7)"
    },
    {
      "code": 6002,
      "name": "noSlotsAvailable",
      "msg": "No available slots for this property"
    },
    {
      "code": 6003,
      "name": "maxSlotsReached",
      "msg": "Maximum slots per player reached"
    },
    {
      "code": 6004,
      "name": "cooldownActive",
      "msg": "Cooldown still active - cannot purchase yet"
    },
    {
      "code": 6005,
      "name": "doesNotOwnProperty",
      "msg": "Player does not own this property"
    },
    {
      "code": 6006,
      "name": "invalidShieldSlots",
      "msg": "Invalid number of slots to shield"
    },
    {
      "code": 6007,
      "name": "targetDoesNotOwnProperty",
      "msg": "Target does not own this property"
    },
    {
      "code": 6008,
      "name": "cannotStealFromSelf",
      "msg": "Cannot steal from yourself"
    },
    {
      "code": 6009,
      "name": "allSlotsShielded",
      "msg": "All slots are shielded"
    },
    {
      "code": 6010,
      "name": "insufficientSlots",
      "msg": "Insufficient slots"
    },
    {
      "code": 6011,
      "name": "noRewardsToClaim",
      "msg": "No rewards to claim"
    },
    {
      "code": 6012,
      "name": "gamePaused",
      "msg": "Game is paused"
    },
    {
      "code": 6013,
      "name": "unauthorized",
      "msg": "Unauthorized - ownership does not match player"
    },
    {
      "code": 6014,
      "name": "invalidAccountCount",
      "msg": "Invalid account count in remaining_accounts"
    },
    {
      "code": 6015,
      "name": "propertyMismatch",
      "msg": "Property mismatch between ownership and property account"
    },
    {
      "code": 6016,
      "name": "noProperties",
      "msg": "No properties provided"
    },
    {
      "code": 6017,
      "name": "invalidTarget",
      "msg": "Invalid target player"
    },
    {
      "code": 6018,
      "name": "insufficientRewardPool",
      "msg": "Insufficient reward pool balance"
    },
    {
      "code": 6019,
      "name": "tooManyProperties",
      "msg": "Too many properties in single claim (max 22)"
    },
    {
      "code": 6020,
      "name": "claimTooSoon",
      "msg": "Claim too soon - wait at least 5 minutes"
    },
    {
      "code": 6021,
      "name": "alreadyFulfilled",
      "msg": "VRF result already fulfilled"
    },
    {
      "code": 6022,
      "name": "vrfNotReady",
      "msg": "VRF result not ready yet - wait at least 1 slot"
    },
    {
      "code": 6023,
      "name": "pendingStealExists",
      "msg": "Pending steal request exists - wait 5 minutes or until fulfilled"
    },
    {
      "code": 6024,
      "name": "notFulfilled",
      "msg": "Steal request not fulfilled yet - cannot close"
    },
    {
      "code": 6025,
      "name": "stealRequestExpired",
      "msg": "Steal request expired - must fulfill within 150 slots (~60 sec)"
    },
    {
      "code": 6026,
      "name": "slotHashUnavailable",
      "msg": "Slot hash unavailable - try again"
    }
  ],
  "types": [
    {
      "name": "adminUpdateEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "updateType",
            "type": "string"
          },
          {
            "name": "newValue",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "devWallet",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "rewardPoolVault",
            "type": "pubkey"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "circulatingSupply",
            "type": "u64"
          },
          {
            "name": "rewardPoolInitial",
            "type": "u64"
          },
          {
            "name": "currentPhase",
            "type": "u8"
          },
          {
            "name": "gamePaused",
            "type": "bool"
          },
          {
            "name": "stealChanceTargetedBps",
            "type": "u16"
          },
          {
            "name": "stealChanceRandomBps",
            "type": "u16"
          },
          {
            "name": "stealCostPercentBps",
            "type": "u16"
          },
          {
            "name": "setBonusBps",
            "type": "u16"
          },
          {
            "name": "maxPropertiesPerClaim",
            "type": "u8"
          },
          {
            "name": "minClaimIntervalMinutes",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "rewardPoolVaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "totalSlotsOwned",
            "type": "u16"
          },
          {
            "name": "lastClaimTimestamp",
            "type": "i64"
          },
          {
            "name": "totalRewardsClaimed",
            "type": "u64"
          },
          {
            "name": "completeSetsOwned",
            "type": "u8"
          },
          {
            "name": "propertiesOwnedCount",
            "type": "u8"
          },
          {
            "name": "totalStealsAttempted",
            "type": "u32"
          },
          {
            "name": "totalStealsSuccessful",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerSetCooldown",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "setId",
            "type": "u8"
          },
          {
            "name": "lastPurchaseTimestamp",
            "type": "i64"
          },
          {
            "name": "cooldownDuration",
            "type": "i64"
          },
          {
            "name": "lastPurchasedPropertyId",
            "type": "u8"
          },
          {
            "name": "propertiesOwnedInSet",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "propertiesCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerSetOwnership",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "setId",
            "type": "u8"
          },
          {
            "name": "totalSlotsInSet",
            "type": "u16"
          },
          {
            "name": "propertiesOwnedIds",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "propertiesCount",
            "type": "u8"
          },
          {
            "name": "hasCompleteSet",
            "type": "bool"
          },
          {
            "name": "firstPropertyTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "property",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "setId",
            "type": "u8"
          },
          {
            "name": "maxSlotsPerProperty",
            "type": "u16"
          },
          {
            "name": "availableSlots",
            "type": "u16"
          },
          {
            "name": "maxPerPlayer",
            "type": "u16"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "yieldPercentBps",
            "type": "u16"
          },
          {
            "name": "shieldCostPercentBps",
            "type": "u16"
          },
          {
            "name": "cooldownSeconds",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "propertyBoughtEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "slotsOwned",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "propertyOwnership",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "slotsOwned",
            "type": "u16"
          },
          {
            "name": "slotsShielded",
            "type": "u16"
          },
          {
            "name": "purchaseTimestamp",
            "type": "i64"
          },
          {
            "name": "shieldExpiry",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "propertySoldEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "slots",
            "type": "u16"
          },
          {
            "name": "received",
            "type": "u64"
          },
          {
            "name": "sellValuePercent",
            "type": "u16"
          },
          {
            "name": "daysHeld",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "rewardsClaimedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "secondsElapsed",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "setStats",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "setId",
            "type": "u8"
          },
          {
            "name": "totalSlotsSold",
            "type": "u64"
          },
          {
            "name": "totalRevenue",
            "type": "u64"
          },
          {
            "name": "uniqueOwners",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "shieldActivatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "slotsShielded",
            "type": "u16"
          },
          {
            "name": "cost",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "stealFailedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attacker",
            "type": "pubkey"
          },
          {
            "name": "target",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "stealCost",
            "type": "u64"
          },
          {
            "name": "targeted",
            "type": "bool"
          },
          {
            "name": "vrfResult",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stealRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attacker",
            "type": "pubkey"
          },
          {
            "name": "target",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "isTargeted",
            "type": "bool"
          },
          {
            "name": "stealCost",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "requestSlot",
            "type": "u64"
          },
          {
            "name": "fulfilled",
            "type": "bool"
          },
          {
            "name": "success",
            "type": "bool"
          },
          {
            "name": "vrfResult",
            "type": "u64"
          },
          {
            "name": "attemptNumber",
            "type": "u32"
          },
          {
            "name": "userRandomness",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stealRequestedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attacker",
            "type": "pubkey"
          },
          {
            "name": "target",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "stealCost",
            "type": "u64"
          },
          {
            "name": "isTargeted",
            "type": "bool"
          },
          {
            "name": "requestSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stealSuccessEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "attacker",
            "type": "pubkey"
          },
          {
            "name": "target",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u8"
          },
          {
            "name": "stealCost",
            "type": "u64"
          },
          {
            "name": "targeted",
            "type": "bool"
          },
          {
            "name": "vrfResult",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
