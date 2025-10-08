/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/defipoly_program.json`.
 */
export type DefipolyProgram = {
  "address": "H1zzYzWPReWJ4W2JNiBrYbsrHDxFDGJ9n9jAyYG2VhLQ",
  "metadata": {
    "name": "defipolyProgram",
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
          "name": "cycles",
          "type": "u8"
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
          "name": "tier",
          "type": {
            "defined": {
              "name": "propertyTier"
            }
          }
        },
        {
          "name": "count",
          "type": "u8"
        },
        {
          "name": "maxSlotsPerProperty",
          "type": "u16"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "dailyIncome",
          "type": "u64"
        },
        {
          "name": "shieldCostPercent",
          "type": "u16"
        }
      ]
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
      "name": "stealProperty",
      "discriminator": [
        94,
        102,
        144,
        133,
        104,
        36,
        40,
        101
      ],
      "accounts": [
        {
          "name": "property"
        },
        {
          "name": "targetOwnership"
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
    }
  ],
  "events": [
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
      "name": "noSlotsAvailable",
      "msg": "No available slots for this property"
    },
    {
      "code": 6001,
      "name": "doesNotOwnProperty",
      "msg": "Player does not own this property"
    },
    {
      "code": 6002,
      "name": "invalidShieldCycles",
      "msg": "Invalid shield cycles (must be 1-3)"
    },
    {
      "code": 6003,
      "name": "targetDoesNotOwnProperty",
      "msg": "Target does not own this property"
    },
    {
      "code": 6004,
      "name": "propertyIsShielded",
      "msg": "Property is shielded and cannot be stolen"
    },
    {
      "code": 6005,
      "name": "insufficientSlots",
      "msg": "Insufficient slots to sell"
    },
    {
      "code": 6006,
      "name": "noRewardsToClaim",
      "msg": "No rewards to claim"
    }
  ],
  "types": [
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
            "name": "rewardPoolInitial",
            "type": "u64"
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
            "name": "totalPropertiesOwned",
            "type": "u16"
          },
          {
            "name": "totalDailyIncome",
            "type": "u64"
          },
          {
            "name": "lastClaimTimestamp",
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
            "name": "tier",
            "type": {
              "defined": {
                "name": "propertyTier"
              }
            }
          },
          {
            "name": "count",
            "type": "u8"
          },
          {
            "name": "maxSlotsPerProperty",
            "type": "u16"
          },
          {
            "name": "totalSlots",
            "type": "u16"
          },
          {
            "name": "availableSlots",
            "type": "u16"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "dailyIncome",
            "type": "u64"
          },
          {
            "name": "shieldCostPercent",
            "type": "u16"
          },
          {
            "name": "familyBonusMultiplier",
            "type": "u16"
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
            "name": "shieldActive",
            "type": "bool"
          },
          {
            "name": "shieldExpiry",
            "type": "i64"
          },
          {
            "name": "shieldCyclesQueued",
            "type": "u8"
          },
          {
            "name": "lastClaimTimestamp",
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
            "name": "burned",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "propertyTier",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "bronze"
          },
          {
            "name": "silver"
          },
          {
            "name": "gold"
          },
          {
            "name": "platinum"
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
            "name": "hoursElapsed",
            "type": "u64"
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
            "name": "cost",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "cycles",
            "type": "u8"
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
          }
        ]
      }
    }
  ]
};
