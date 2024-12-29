/* PK = USER#<username> */
/* SK = PROFILE */
resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-UsersTable-${random_id.default.hex}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  global_secondary_index {
    name            = "${var.project_name}-UsernameIndex-${random_id.default.hex}"
    hash_key        = "username"
    range_key       = "SK"
    projection_type = "ALL"
  }

  attribute {
    name = "username"
    type = "S"
  }
}

/* PK = USER#<username> */
/* SK = POST#<post_id> */
resource "aws_dynamodb_table" "posts" {
  name         = "${var.project_name}-PostsTableV2-${random_id.default.hex}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  global_secondary_index {
    name            = "CreatedAtIndex"
    hash_key        = "PK"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  attribute {
    name = "created_at"
    type = "N"
  }
}

/* PK = GLOBAL#POSTS */
/* SK = POST#<post_id> */
resource "aws_dynamodb_table" "global_posts" {
  name         = "${var.project_name}-GlobalPostsTableV2-${random_id.default.hex}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  global_secondary_index {
    name            = "CreatedAtIndex"
    hash_key        = "PK"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  attribute {
    name = "created_at"
    type = "N"
  }
}

/* PK = POST#<uuid> */
/* SK = COMMENT#<uuid> */
resource "aws_dynamodb_table" "comments" {
  name         = "${var.project_name}-Comments-${random_id.default.hex}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  global_secondary_index {
    name            = "CreatedAtIndex"
    hash_key        = "PK"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  attribute {
    name = "created_at"
    type = "N"
  }
}